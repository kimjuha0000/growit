# -*- coding: utf-8 -*-
from pyspark.sql import SparkSession
from pyspark.sql.functions import to_date, to_timestamp, col, count as Fcount
import os

# =========================
# ENV
# =========================
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB   = os.getenv("POSTGRES_DB", "dwh")
POSTGRES_USER = os.getenv("POSTGRES_USER", "analytics")
POSTGRES_PW   = os.getenv("POSTGRES_PASSWORD", "secret")

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
MINIO_ACCESS   = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET   = os.getenv("MINIO_SECRET_KEY", "admin12345")
MINIO_BUCKET   = os.getenv("MINIO_BUCKET", "logs")

BRONZE_BASE = f"s3a://{MINIO_BUCKET}/bronze/app/"
DELTA_OUT   = "/data/delta/events"
PG_TABLE    = "mart.daily_events"

# =========================
# Spark Session
# =========================
spark = (SparkSession.builder
    .appName("logs_etl")
    .config("spark.jars.packages", ",".join([
        "io.delta:delta-spark_2.12:3.2.0",
        "org.postgresql:postgresql:42.7.4",
        "org.apache.hadoop:hadoop-aws:3.3.4",
        "com.amazonaws:aws-java-sdk-bundle:1.12.772",
    ]))
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
    .getOrCreate())

# =========================
# 1) Read Bronze(JSONL) & Transform
# =========================
df = (spark.read
      .option("recursiveFileLookup", "true")
      .json(BRONZE_BASE))

df2 = (df
       .withColumn("ts_parsed", to_timestamp(col("ts")))
       .withColumn("event_date", to_date(col("ts_parsed")))
       .select("event_date", "user_id")
       .dropna(subset=["event_date", "user_id"]))

agg = df2.groupBy("event_date", "user_id").agg(Fcount("*").alias("cnt"))

# =========================
# 2) Write to Delta (권장)
# =========================
(agg.write
 .format("delta")
 .mode("append")
 .partitionBy("event_date")
 .save(DELTA_OUT))

# =========================
# 3) 대상 일자 선삭제 (JDBC via JVM, psycopg2 불필요)
# =========================
dates = [r[0] for r in agg.select("event_date").distinct().collect()]  # list[datetime.date]

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
# 4) Append to Postgres
# =========================
(agg.write
 .format("jdbc")
 .option("url", f"jdbc:postgresql://{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
 .option("dbtable", PG_TABLE)
 .option("user", POSTGRES_USER)
 .option("password", POSTGRES_PW)
 .option("driver", "org.postgresql.Driver")
 .mode("append")
 .save())

spark.stop()
