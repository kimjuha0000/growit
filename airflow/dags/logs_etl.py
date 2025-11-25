from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from datetime import datetime, timedelta
import os

default_args = {"owner": "you", "retries": 1, "retry_delay": timedelta(minutes=2)}

with DAG(
    dag_id="logs_etl",
    start_date=datetime(2025, 10, 11),
    schedule=os.getenv("AIRFLOW_SCHEDULE", "*/30 * * * *"),  # schedule_interval 대신 schedule 권장
    catchup=False,
    default_args=default_args,
    max_active_runs=1,
) as dag:

    check_new = BashOperator(
        task_id="check_new",
        bash_command="find /data/bronze/app -type f -mmin -180 | head -n 1 | wc -l"
    )

    run_spark = SparkSubmitOperator(
        task_id="run_logs_etl",
        application="/opt/spark/app/job_etl.py",
        # master 파라미터 제거 → conf로 전달(또는 conn_id 사용)
        packages="io.delta:delta-spark_2.12:3.2.0,org.postgresql:postgresql:42.7.4,org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.12.772",
        # jars_ivy 제거하고 conf에 spark.jars.ivy로
        conf={
            "spark.master": "spark://spark-master:7077",
            "spark.jars.ivy": "/tmp/.ivy2",

            "spark.driver.extraClassPath": "/tmp/.ivy2/jars/org.postgresql_postgresql-42.7.4.jar",
            "spark.executor.extraClassPath": "/tmp/.ivy2/jars/org.postgresql_postgresql-42.7.4.jar",

            "spark.hadoop.fs.s3a.endpoint": "http://minio:9000",
            "spark.hadoop.fs.s3a.access.key": "admin",
            "spark.hadoop.fs.s3a.secret.key": "admin12345",
            "spark.hadoop.fs.s3a.path.style.access": "true",
            "spark.hadoop.fs.s3a.connection.ssl.enabled": "false",
            "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
            "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
        },
        # 필요하면 conn_id="spark_default" 를 쓰고, Connection에 master 설정해도 됩니다.
        conn_id="spark_default",
    )

    check_pg = BashOperator(
        task_id="check_pg",
        bash_command="echo 'validate counts here (psql or python)'"
    )

    check_new >> run_spark >> check_pg
