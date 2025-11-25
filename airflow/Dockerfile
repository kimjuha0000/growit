FROM apache/airflow:2.10.2

# ---- root 권한 구간: OS 패키지 / Java / Spark 설치 ----
USER root
ENV DEBIAN_FRONTEND=noninteractive

# Java 17 설치
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl openjdk-17-jre-headless \
 && rm -rf /var/lib/apt/lists/*

# Spark 3.5.1 설치
RUN curl -L "https://archive.apache.org/dist/spark/spark-3.5.1/spark-3.5.1-bin-hadoop3.tgz" \
      -o /tmp/spark.tgz \
 && mkdir -p /opt/spark \
 && tar -xzf /tmp/spark.tgz -C /opt/spark --strip-components=1 \
 && rm -f /tmp/spark.tgz

# 환경변수
ENV SPARK_HOME=/opt/spark
ENV PATH="${SPARK_HOME}/bin:${PATH}"
# (Debian/Ubuntu 경로 기준) Java 17 경로 지정
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# ---- airflow 유저로 전환: pip 설치는 여기서 ----
USER airflow

# requirements.txt 복사 및 설치
COPY --chown=airflow:root requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
