# Learning Pipeline Hub - 프로젝트 상세 매뉴얼

이 문서는 Learning Pipeline Hub 프로젝트의 아키텍처, 구성 요소별 역할, 데이터 흐름 등 내부 동작을 상세히 설명합니다.

`README.md`가 프로젝트를 빠르게 실행하는 데 초점을 맞춘다면, 이 문서는 **"왜 이렇게 구성되었는가?"** 와 **"내부에서 데이터가 어떻게 움직이는가?"** 에 대한 깊은 이해를 돕기 위해 작성되었습니다.

## 0. 프로젝트 실행 환경 요구사항

이 프로젝트는 Docker를 기반으로 구축되었습니다. 따라서 프로젝트를 구동하기 위한 필수 전제 조건은 **Docker가 설치되어 있는 환경**입니다.

새로운 PC에서 이 프로젝트를 실행하고자 할 경우, 다음 사항을 **PC 당 최초 1회** 설정해야 합니다. 이 설정들은 프로젝트 코드와 함께 Git에 포함되지 않으며, 각 PC의 운영체제 환경에 의존합니다.

1.  **Docker 설치:** 먼저 PC에 Docker Desktop (Windows/macOS) 또는 Docker Engine (Linux)을 설치해야 합니다.
2.  **권한 설정:** Docker 컨테이너가 호스트 머신의 특정 폴더에 데이터를 읽고 쓸 수 있도록 해당 폴더에 대한 권한을 설정해야 합니다.

---

## 1. 권한 설정 가이드

Docker는 컨테이너 내부의 사용자(User)와 호스트 머신의 사용자가 달라 파일 접근 권한 문제가 발생할 수 있습니다. 특히 컨테이너가 생성한 데이터를 호스트 머신의 폴더(볼륨)에 저장할 때 이 문제가 두드러집니다.

### 1.1. Docker 실행 권한 (macOS / Linux 사용자)

매번 `sudo`를 입력하지 않고 `docker` 명령어를 사용하려면, 현재 사용자를 `docker` 그룹에 추가해야 합니다.

```bash
# docker 그룹이 없으면 생성
sudo groupadd docker

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 변경 사항을 적용하려면 로그아웃 후 다시 로그인하거나, newgrp 명령을 사용합니다.
newgrp docker
```
터미널을 재시작하면 `sudo` 없이 `docker compose ps`와 같은 명령을 실행할 수 있습니다.

### 1.2. 공유 볼륨 폴더 권한

`data`, `pg`, `tmp` 폴더는 여러 컨테이너가 데이터를 읽고 쓰는 공유 공간입니다. 따라서 컨테이너 내부의 프로세스가 이 폴더들에 접근할 수 있도록 호스트 머신에서 적절한 권한을 부여해야 합니다.

-   **Windows (PowerShell 관리자 권한으로 실행):**
    ```powershell
    # 프로젝트 루트 폴더에서 실행합니다.
    # data, pg, tmp 폴더를 만들고, 모든 사용자(Users 그룹)에게
    # 모든 권한(F)을 하위 폴더와 파일에도 상속(OI, CI)하며 적용(T)합니다.
    mkdir data, pg, tmp -Force
    icacls data, pg, tmp /grant "Users:(OI)(CI)F" /T
    ```

-   **macOS / Linux:**
    ```bash
    # 프로젝트 루트 폴더에서 실행합니다.
    mkdir -p data pg tmp

    # 폴더 소유자를 현재 사용자로 변경하고,
    # 소유자와 그룹에 읽기/쓰기/실행 권한을 부여합니다.
    # sudo chown -R $USER:$USER data pg tmp
    chmod -R 775 data pg tmp
    ```

## 2. 아키텍처와 컨테이너별 역할

이 프로젝트는 여러 전문화된 오픈소스들을 조합하여 현대적인 데이터 플랫폼을 구축한 마이크로서비스 아키텍처(MSA)를 따릅니다.

### 컨테이너별 역할과 당위성 (Justification)

| 컨테이너 | 기술 | 역할 (무엇을 하는가?) | 당위성 (왜 필요한가?) |
| --- | --- | --- | --- |
| `web` | FastAPI (Python) | API 서버 및 프론트엔드 서빙 | 사용자와의 접점. 이벤트 데이터를 수신하여 파이프라인에 전달하는 첫 관문. |
| `growit` | React (Node.js) | 사용자 인터페이스(UI) | 사용자가 실제로 보고 상호작용하는 웹 화면. 이 프로젝트의 데이터 발생 근원지. |
| `minio` | MinIO | 객체 스토리지 (S3 호환) | 수집된 원본 데이터를 안전하고 저렴하게 보관하는 **데이터 레이크** 역할. |
| `postgres` | PostgreSQL | 관계형 데이터베이스(RDB) | 최종적으로 집계/처리된 데이터를 저장하는 **데이터 마트** 역할. BI 툴 연동에 용이. |
| `airflow` | Airflow | 워크플로 관리 | "매일 새벽 1시에 Spark ETL 실행"과 같은 복잡한 데이터 작업을 예약/관리/모니터링. |
| `spark` | Spark | 분산 데이터 처리 엔진 | 대용량의 원본 데이터를 읽어 정제, 변환, 집계하는 **ETL의 핵심 두뇌**. |
| `zeppelin` | Zeppelin | 웹 기반 노트북 | 분석가가 Spark, SQL 등을 사용해 데이터를 탐색하고 시각화하는 **분석 환경**. |

---

## 3. 데이터 파이프라인 상세 흐름

사용자의 클릭 한 번이 어떻게 분석 가능한 데이터가 되는지 전 과정을 따라가 보겠습니다.

-   **Bronze**: 원본 데이터 (날것)
-   **Silver**: 정제/변환된 데이터
-   **Gold**: 최종 집계/분석용 데이터

**`[1단계]` 데이터 발생 (Frontend: `growit`)**
-   사용자가 브라우저(`http://localhost:3300`)에서 특정 카테고리의 "추천 강의 요청" 버튼을 클릭합니다.
-   React 앱은 `axios`와 같은 라이브러리를 사용해 백엔드 서버로 API 요청을 보냅니다. (예: `POST /api/events`)

**`[2단계]` 로그 수집 (Backend: `web`)**
-   FastAPI 서버가 `/api/events` 요청을 수신합니다.
-   `web/app.py`의 `_log_event` 함수는 요청 내용(`event_type`, `metadata` 등)과 서버 정보(IP, User-Agent)를 조합하여 하나의 JSON 객체를 생성합니다.

**`[3단계]` 원본 데이터 저장 (Bronze Layer: `web` → `data`/`minio`)**
-   생성된 JSON 객체는 한 줄의 문자열로 변환되어, 호스트와 공유된 볼륨(`data/`)의 날짜별 폴더에 `.jsonl` 파일로 추가(append)됩니다. (예: `data/bronze/app/2025/11/28/... .jsonl`)
-   `.env` 파일에 `USE_MINIO=true`로 설정되어 있으면, 이 파일은 `minio` 컨테이너의 `logs` 버킷에도 업로드됩니다. 이로써 원본 데이터가 데이터 레이크에 안전하게 보관됩니다.

**`[4단계]` ETL 작업 실행 (Orchestration: `airflow`)**
-   `airflow` 컨테이너는 정해진 스케줄(예: 매일 자정)이 되면 `logs_etl`이라는 DAG(Directed Acyclic Graph)를 실행합니다.
-   이 DAG의 주요 임무는 `spark-submit` 명령을 통해 `spark` 클러스터에 ETL 작업을 제출(submit)하는 것입니다.

**`[5단계]` 데이터 처리 및 변환 (ETL / Silver Layer: `spark`)**
-   `spark` 클러스터는 `spark/app/job_etl.py` 스크립트를 실행합니다.
-   Spark는 먼저 Bronze Layer(`data/bronze/app` 또는 MinIO)에서 원본 `.jsonl` 파일들을 모두 읽어 데이터프레임으로 만듭니다.
-   이후 스키마 적용, 타임스탬프 변환, 고유 ID 생성, 중복 제거 등 다양한 정제 및 변환 작업을 거쳐 분석에 용이한 '깨끗한 데이터'로 가공합니다.

**`[6단계]` 데이터 적재 (Silver/Gold Layers: `spark` → `delta`/`postgres`)**
-   **Silver Layer**: 가공된 데이터는 `/data/delta/events` 경로에 **Delta Lake** 형식으로 저장됩니다. 이때 `event_date` 기준으로 데이터가 파티셔닝되어 저장되므로, 특정 날짜를 조회할 때 성능이 매우 뛰어납니다.
-   **Gold Layer**: 동시에, 동일한 데이터가 JDBC를 통해 `postgres` 컨테이너의 `mart.events` 테이블에도 저장됩니다. 이 테이블은 최종 분석이나 외부 BI 툴(Tableau 등)과 연동하기 위한 **데이터 마트** 역할을 합니다.

**`[7단계]` 데이터 분석 (Analytics: `zeppelin`)**
-   데이터 분석가는 `zeppelin` UI(`http://localhost:8181`)에 접속합니다.
-   Zeppelin의 Spark 인터프리터를 사용하여 Delta Lake에 저장된 대용량 데이터를 직접 읽어와(예: `spark.read.format("delta").load(...)` ) PySpark이나 SQL로 자유롭게 탐색하고, 집계하고, 그 결과를 즉시 시각화합니다.

## 4. 데이터 분석 방법

Zeppelin을 사용한 데이터 분석은 주로 Spark 인터프리터를 통해 Delta Lake의 데이터를 직접 분석하는 방식을 권장합니다.

1.  Zeppelin 노트에서 인터프리터를 `%spark.pyspark`로 설정합니다.
2.  아래 코드로 Delta Lake 테이블을 로드하고, SQL 쿼리가 가능하도록 임시 뷰(View)를 생성합니다.
    ```python
    # /data/delta/events 경로의 델타 테이블을 읽어 df 라는 변수에 할당
    df = spark.read.format("delta").load("/data/delta/events")

    # df를 'events_delta' 라는 이름의 임시 테이블로 등록
    df.createOrReplaceTempView("events_delta")
    ```
3.  이제 `%sql` 인터프리터를 사용하여 등록된 `events_delta` 테이블을 자유롭게 쿼리할 수 있습니다.
    ```sql
    %sql
    SELECT type, count(1) AS cnt
    FROM events_delta
    GROUP BY type
    ORDER BY cnt DESC
    LIMIT 10
    ```
4.  쿼리 실행 후, 결과 테이블 하단의 차트 버튼을 눌러 원하는 형태로 시각화합니다.