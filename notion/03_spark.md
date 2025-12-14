# **세 번째 여정: 원석을 보석으로, Spark로 데이터 다듬기**

MinIO라는 든든한 저장고에 원본 로그(JSONL)를 쌓기 시작하니 마음은 편해졌지만, 새로운 숙제가 생겼습니다. 저장된 로그는 아직 가공되지 않은 '원석'과 같았습니다. 어떤 줄은 데이터가 비어있기도 하고, 형식이 제각각인 값들도 섞여 있었죠. 이 원석들 속에서 진짜 의미있는 '보석'을 찾아내려면, 이들을 깨끗하게 씻고, 다듬고, 분류하는 '세공' 과정이 필요했습니다.

데이터의 양이 적다면 간단한 스크립트로도 충분했겠지만, 저는 앞으로 데이터가 수십, 수백만 건으로 늘어날 것을 대비해야 했습니다. 거대한 원석 더미를 빠르고 효율적으로 처리할 수 있는 강력한 '공방'이 필요했고, 그 해답은 바로 **Spark**였습니다.

## **왜 'Spark'라는 공방을 선택했나?**

-   **분업의 대가 (병렬 처리)**: 거대한 원석 더미를 한 명이 처리하는 대신, 여러 명의 장인(Worker)이 작업을 나눠서 동시에 처리하는 것과 같습니다. Spark는 데이터를 여러 조각(Partition)으로 나누고, 여러 작업자에게 분배해 처리 속도를 극적으로 높여줍니다.
-   **최고의 변환 기술 (포맷 변환)**: Spark는 한 줄씩 텍스트로 저장된 JSONL을, 분석에 훨씬 효율적인 컬럼 기반 포맷(Delta Lake, Parquet)으로 변환하는 데 특화되어 있습니다. 이건 마치 원석을 녹여, 순도 높고 다루기 쉬운 금괴로 만드는 것과 같죠.
-   **미래를 위한 확장성**: 지금은 제 개인 컴퓨터(단일 노드)에서 Spark를 돌리지만, 나중에 데이터가 정말 많아지면 똑같은 코드를 거의 그대로 사용해서 수십, 수백 대의 컴퓨터 클러스터 환경에서도 실행할 수 있습니다. 미래를 위한 최고의 보험인 셈이죠.

## **나의 데이터 세공 과정: ETL(추출, 변환, 적재)**

저는 Spark를 이용해 다음과 같은 3단계의 데이터 세공(ETL) 파이프라인을 설계했습니다.

```mermaid
flowchart LR
  Bronze[/data/bronze/app/*.jsonl/] -->|1. Extract (추출)| Spark
  Spark -->|2. Transform (변환)| Clean[깨끗해진 DataFrame]
  Clean -->|3. Load (적재)| Delta[/data/delta/events/]
  Clean -->|JDBC| Postgres[(Postgres 분석용 테이블)]
```

### **1단계: 원석 캐내기 (Extract)**

가장 먼저, MinIO 또는 로컬 디스크에 쌓여있는 모든 JSONL 원석들을 Spark 공방으로 가져와야 했습니다. Docker 컨테이너 안에서 Spark의 대화형 셸(`pyspark`)을 실행하고, 간단한 명령어로 모든 파일을 한 번에 불러왔습니다.

```bash
# 먼저 Spark 컨테이너에 접속합니다
$ docker compose exec spark bash

# 그리고 pyspark를 실행!
$ pyspark
```
```python
# PySpark 셸에서 실행
# 날짜별로 정리된 모든 jsonl 파일을 한번에 읽어들입니다. 마법 같죠?
df_raw = spark.read.json("/data/bronze/app/*/*/*/*.jsonl")

print("발견된 원석(로그) 개수:", df_raw.count())
df_raw.show(5) # 5개만 맛보기로 구경해봅니다.
```

### **2단계: 불순물 제거하고 다듬기 (Transform)**

이제부터가 진짜 세공 작업입니다. 원석 중에는 흠집이 있거나(null 값), 모양이 삐뚤어진(잘못된 형식) 것들이 섞여있기 마련입니다. `filter`로 불량품을 걸러내고, `withColumn`으로 새로운 가치를 부여하는 작업을 진행했습니다.

```python
from pyspark.sql import functions as F

# 1. type 필드가 없는 불량 데이터는 과감히 버립니다.
df_filtered = df_raw.filter(F.col("type").isNotNull())

# 2. 분석하기 편하도록, ISO 형식의 timestamp 문자열에서 날짜 부분만 추출해 
#    'event_date' 라는 새로운 컬럼을 만들어 줍니다.
df_clean = df_filtered.withColumn("event_date", F.to_date(F.col("props.timestamp")))

print("세공 후 남은 보석 개수:", df_clean.count())
df_clean.select("type", "props.client_ip", "event_date").show(5)
```

### **3단계: 보석함에 담기 (Load)**

깨끗하게 세공된 데이터는 이제 두 개의 서로 다른 보석함에 담아, 용도에 맞게 사용할 준비를 합니다.

-   **첫 번째 보석함, Delta Lake**: 원본 데이터의 신뢰성과 이력을 관리할 수 있는 고급 보석함입니다. 나중에 더 복잡한 분석이나 머신러닝에 사용하기 위해, 정제된 데이터를 Delta 포맷으로 저장해 둡니다.

    ```python
    df_clean.write.format("delta").mode("overwrite").save("/data/delta/events")
    ```

-   **두 번째 보석함, PostgreSQL**: 당장 분석가나 기획자가 빠르고 쉽게 데이터를 조회할 수 있도록 만든 진열대 같은 보석함입니다. JDBC 연결을 통해 정제된 데이터를 최종 목적지인 PostgreSQL 데이터베이스의 `mart.events` 테이블에 밀어 넣습니다.

    ```python
    (df_clean.write
     .format("jdbc")
     .option("url", "jdbc:postgresql://pg:5432/postgres")
     .option("dbtable", "mart.events")
     .option("user", "postgres") # 실제로는 환경변수 사용
     .option("password", "password") # 실제로는 환경변수 사용
     .mode("overwrite")
     .save())
    ```

## **초보 장인의 실수담: 제가 겪었던 문제들**

이 과정이 항상 순탄했던 것만은 아닙니다. 몇 번의 실패를 통해 더 단단해질 수 있었죠.
-   **"권한이 없어요!"**: Spark가 데이터에 접근하지 못하는 문제였습니다. Docker가 파일을 마운트할 때 호스트와 컨테이너의 사용자 권한이 맞지 않았기 때문이죠. 호스트에서 `chown` 명령어로 폴더 주인을 바꿔주어 해결했습니다.
-   **"메모리가 터졌어요!"**: 로컬 환경에서 테스트할 때, 무심코 대용량 데이터 전체를 `collect()` 명령으로 가져오려다 Spark가 죽어버리는 경험을 했습니다. `show()`, `take()`, `sample()`을 사용해 작은 데이터로 결과를 확인하는 습관을 들이게 된 계기였죠.

이렇게 원석을 보석으로 바꾸는 과정을 거치고 나니, 비로소 데이터에서 가치를 찾을 준비가 끝났다는 확신이 들었습니다. Spark라는 강력한 공방 덕분에, 저는 이제 데이터의 양에 겁먹지 않고, 그 안에 숨겨진 패턴을 찾아 떠날 수 있게 되었습니다.