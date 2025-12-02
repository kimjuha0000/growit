# GrowIt Pipeline ERD

모든 페이지/컴포넌트의 클릭·입력·페이지 진입 이벤트가 `/api/events`로 수집되고, Bronze(JSONL) → Delta → Postgres 마트로 흘러가는 경로를 정리했습니다.

```mermaid
erDiagram
    USERS ||--o{ UI_EVENTS : performs
    UI_EVENTS ||--o{ BRONZE_LOGS : appendedTo
    BRONZE_LOGS ||--o{ DELTA_EVENTS : refinedInto
    DELTA_EVENTS ||--o{ MART_EVENTS : publishedTo
    MART_EVENTS ||--o{ MART_DAILY_EVENTS : aggregatedInto
    BRONZE_LOGS ||--o{ MINIO_OBJECTS : mirroredAs
    CATEGORIES ||--o{ RECOMMENDATIONS : requestedFor

    USERS {
        string username PK
        string full_name
        string password
        string[] interests
    }

    UI_EVENTS {
        string id PK
        string type          // page_view, ui_click, ui_change, search_query, video_open 등
        datetime ts
        string username FK
        json props           // path, tag, track_name, metadata
    }

    BRONZE_LOGS {
        string path PK       // /data/bronze/app/YYYY/MM/DD/part-*.jsonl
        date event_date
    }

    DELTA_EVENTS {
        string id PK
        date event_date
        string username FK
        json props
        string source_file
    }

    MART_EVENTS {
        string id PK
        timestamp ts
        string username FK
        json props
    }

    MART_DAILY_EVENTS {
        date event_date PK
        string user_id PK
        bigint cnt
    }

    MINIO_OBJECTS {
        string bucket PK
        string object_key
        datetime uploaded_at
    }

    CATEGORIES {
        string id PK
        string name
        string accent
    }

    RECOMMENDATIONS {
        string id PK
        string username FK
        string category_id FK
        datetime requested_at
    }
```

## 흐름 요약
- **UI_EVENTS**: 전역 클릭(`ui_click`), 입력(`ui_change`), 페이지뷰(`page_view`), 검색/카테고리/영상 관련 이벤트가 모두 FastAPI로 전달됩니다.
- **BRONZE_LOGS**: FastAPI가 `/data/bronze/app/YYYY/MM/DD/part-*.jsonl`에 append, `USE_MINIO=true`일 때 동일 파일을 MinIO `logs` 버킷으로 업로드.
- **DELTA_EVENTS**: Spark ETL(`spark/app/job_etl.py`)이 Bronze를 Delta로 정제하면서 파티션(`event_date`)을 만듭니다.
- **MART_EVENTS / MART_DAILY_EVENTS**: 같은 ETL이 Postgres에 상세(`mart.events`)와 일자·사용자 집계(`mart.daily_events`)를 적재합니다.
- **CATEGORIES / RECOMMENDATIONS**: 추천 요청(`/api/recommendations`) 흐름을 개념적으로 표현했습니다. 요청도 이벤트(`category_recommendation`)로 기록됩니다.

## 빠른 검증 쿼리
```sql
-- 일자별 이벤트 건수
SELECT event_date, SUM(cnt) AS total_events
FROM mart.daily_events
GROUP BY event_date
ORDER BY event_date DESC;

-- 특정 유저의 최신 이벤트 20건
SELECT ts, type, props
FROM mart.events
WHERE username = 'datafan'
ORDER BY ts DESC
LIMIT 20;
```
