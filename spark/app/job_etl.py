# -*- coding: utf-8 -*-
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    concat_ws,
    input_file_name,
    sha2,
    to_date,
    to_json,
    to_timestamp,
)
import os

# =========================
# ENV
# =========================
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "dwh")
POSTGRES_USER = os.getenv("POSTGRES_USER", "analytics")
POSTGRES_PW = os.getenv("POSTGRES_PASSWORD", "secret")

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
MINIO_ACCESS = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET = os.getenv("MINIO_SECRET_KEY", "admin12345")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "logs")

# 기본은 로컬 공유 볼륨을 읽고, 필요하면 BRONZE_BASE를 s3a://… 형태로 덮어써 MinIO를 직접 읽을 수 있습니다.
BRONZE_BASE = os.getenv("BRONZE_BASE", "/data/bronze/app/")
DELTA_OUT = os.getenv("DELTA_EVENTS_PATH", "/data/delta/events")
PG_TABLE = os.getenv("PG_EVENTS_TABLE", "mart.events")

# =========================
# Spark Session
# =========================
spark = (
    SparkSession.builder.appName("logs_etl")
    .config(
        "spark.jars.packages",
        ",".join(
            [
                "io.delta:delta-spark_2.12:3.2.0",
                "org.postgresql:postgresql:42.7.4",
                "org.apache.hadoop:hadoop-aws:3.3.4",
                "com.amazonaws:aws-java-sdk-bundle:1.12.772",
            ]
        ),
    )
    # Delta
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
    # S3A(MinIO)
    .config("spark.hadoop.fs.s3a.endpoint", MINIO_ENDPOINT)
    .config("spark.hadoop.fs.s3a.access.key", MINIO_ACCESS)
    .config("spark.hadoop.fs.s3a.secret.key", MINIO_SECRET)
    .config("spark.hadoop.fs.s3a.path.style.access", "true")
    .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
    .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
    # (선택) S3 Delta용
    .config("spark.delta.logStore.s3a.impl", "org.apache.spark.sql.delta.storage.S3SingleDriverLogStore")
    # Delta 스키마 자동 병합 (기존 집계 스키마에서 이벤트 스키마로 전환 시 필요)
    .config("spark.databricks.delta.schema.autoMerge.enabled", "true")
    .getOrCreate()
)

# =========================
# 1) Read Bronze(JSONL) & Transform (event-level, ERD 맞춤)
# =========================
df = spark.read.option("recursiveFileLookup", "true").json(BRONZE_BASE)

df2 = (
    df
    .withColumn("source_file", input_file_name())
    .withColumn("ts_parsed", to_timestamp(col("ts")))
    .withColumn("event_date", to_date(col("ts_parsed")))
    .withColumn("event_id", sha2(concat_ws("||", col("user_id"), col("ts"), col("type")), 256))
    .withColumn("props_json", to_json(col("props")))  # 그대로 JSON 직렬화(별도 CAST 불필요)
    .withColumn("server_json", to_json(col("_server")))  # JDBC에서 stringtype=unspecified로 jsonb 매핑
    .select(
        col("event_id").alias("id"),
        col("type"),
        col("ts_parsed").alias("ts"),
        col("event_date"),
        col("user_id").alias("username"),
        col("props_json").alias("props"),
        col("server_json").alias("server"),
        col("source_file"),
    )
    .dropna(subset=["id", "ts", "event_date", "username", "type"])
    .dropDuplicates(["id"])
)

# =========================
# 2) Write to Delta (권장) - 이벤트 상세 적재
# =========================
(
    df2.write.format("delta")
    .mode("append")
    .option("mergeSchema", "true")
    .partitionBy("event_date")
    .save(DELTA_OUT)
)

# =========================
# 3) 대상 일자 선삭제 & 테이블 생성 보장 (JDBC via JVM)
# =========================
dates = [r[0] for r in df2.select("event_date").distinct().collect()]  # list[datetime.date]

if dates:
    jvm = spark._jvm
    # 드라이버 로드
    jvm.java.lang.Class.forName("org.postgresql.Driver")
    # 접속 프로퍼티
    props = jvm.java.util.Properties()
    props.setProperty("user", POSTGRES_USER)
    props.setProperty("password", POSTGRES_PW)

    url = f"jdbc:postgresql://{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    conn = jvm.java.sql.DriverManager.getConnection(url, props)
    try:
        # 테이블 생성(없을 경우)
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {PG_TABLE} (
            id TEXT PRIMARY KEY,
            type TEXT,
            ts TIMESTAMP,
            event_date DATE,
            username TEXT,
            props JSONB,
            server JSONB,
            source_file TEXT
        );
        """
        conn.createStatement().execute(create_sql)

        # PreparedStatement로 안전하게 반복 삭제
        sql = f"DELETE FROM {PG_TABLE} WHERE event_date = ?"
        ps = conn.prepareStatement(sql)
        for d in dates:
            # java.sql.Date.valueOf("YYYY-MM-DD")
            ps.setDate(1, jvm.java.sql.Date.valueOf(str(d)))  # d는 datetime.date
            ps.addBatch()
        ps.executeBatch()
        ps.close()
    finally:
        conn.close()

# =========================
# 4) Append to Postgres (이벤트 상세 적재)
# =========================
(
    df2.write.format("jdbc")
    .option(
        "url",
        f"jdbc:postgresql://{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}?stringtype=unspecified",
    )  # to_json 문자열을 jsonb로 전달
    .option("dbtable", PG_TABLE)
    .option("user", POSTGRES_USER)
    .option("password", POSTGRES_PW)
    .option("driver", "org.postgresql.Driver")
    .option(
        "createTableColumnTypes",
        "id TEXT, type TEXT, ts TIMESTAMP, event_date DATE, username TEXT, props JSONB, server JSONB, source_file TEXT",
    )
    .mode("append")
    .save()
)

spark.stop()
