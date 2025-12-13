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

    run_spark = BashOperator(
        task_id="run_logs_etl",
        bash_command=(
            "export POSTGRES_PASSWORD=$POSTGRES_PASSWORD; "
            "/opt/spark/bin/spark-submit "
            "--master spark://spark-master:7077 "
            "--packages io.delta:delta-spark_2.12:3.2.0,org.postgresql:postgresql:42.7.4,org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.12.772 "
            "--conf spark.jars.ivy=/tmp/.ivy2 "
            "--conf spark.driver.extraClassPath=/tmp/.ivy2/jars/org.postgresql_postgresql-42.7.4.jar "
            "--conf spark.executor.extraClassPath=/tmp/.ivy2/jars/org.postgresql_postgresql-42.7.4.jar "
            "--conf spark.hadoop.fs.s3a.endpoint=http://minio:9000 "
            "--conf spark.hadoop.fs.s3a.access.key=admin "
            "--conf spark.hadoop.fs.s3a.secret.key=admin12345 "
            "--conf spark.hadoop.fs.s3a.path.style.access=true "
            "--conf spark.hadoop.fs.s3a.connection.ssl.enabled=false "
            "--conf spark.sql.extensions=io.delta.sql.DeltaSparkSessionExtension "
            "--conf spark.sql.catalog.spark_catalog=org.apache.spark.sql.delta.catalog.DeltaCatalog "
            "/opt/spark/app/job_etl.py"
        ),
    )

    check_pg = BashOperator(
        task_id="check_pg",
        bash_command="echo 'validate counts here (psql or python)'"
    )

    check_new >> run_spark >> check_pg
