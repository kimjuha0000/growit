import json
import os
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {"owner": "simulator", "retries": 0}

SYNTHETIC_SCHEDULE = os.getenv("AIRFLOW_SYNTHETIC_SCHEDULE", "*/30 * * * *")
BRONZE_PRIMARY = Path(os.getenv("SYNTHETIC_BRONZE_PRIMARY", "/data/bronze/app"))
# 파일이 숨겨진 컨테이너 내부 경로로 들어가지 않도록 기본값은 호스트에 마운트된 /data/bronze/app 하나만 사용합니다.
USER_COUNT = 50

CATEGORIES = [
    "data-engineering",
    "ai-labs",
    "marketing",
    "product-design",
    "backend",
    "cloud-platforms",
    "analytics",
    "devops",
    "mobile",
    "business-intelligence",
]

EVENT_TYPES = [
    "page_view",
    "ui_click",
    "ui_change",
    "search_query",
    "video_open",
    "category_select",
    "category_recommendation",
    "cart",
    "checkout",
    "login",
    "logout",
]

PATHS = [
    "/",
    "/categories",
    "/courses",
    "/search",
    "/cart",
    "/my-page",
    "/player",
]


def _user_profiles() -> list[dict]:
    profiles = []
    for i in range(1, USER_COUNT + 1):
        primary = random.choice(CATEGORIES)
        secondary = random.choice([c for c in CATEGORIES if c != primary])
        profiles.append(
            {
                "username": f"user-{i:04d}",
                "interests": [primary, secondary],
            }
        )
    return profiles


def _resolve_root() -> Path:
    root = BRONZE_PRIMARY
    root.mkdir(parents=True, exist_ok=True)
    test_file = root / ".write_probe"
    try:
        with test_file.open("w", encoding="utf-8") as f:
            f.write("ok")
    finally:
        test_file.unlink(missing_ok=True)
    print(f"[synthetic_events] writing to {root}")
    return root


def _dest_path(now: datetime) -> Path:
    root = _resolve_root()
    y, m, d, hh = now.strftime("%Y"), now.strftime("%m"), now.strftime("%d"), now.strftime("%H")
    dest_dir = root / y / m / d
    dest_dir.mkdir(parents=True, exist_ok=True)
    return dest_dir / f"part-{y}{m}{d}-{hh}-synthetic.jsonl"


def generate_synthetic_events():
    now = datetime.now(timezone.utc)
    dest = _dest_path(now)
    profiles = _user_profiles()
    events = []

    for prof in profiles:
        session_events = random.randint(12, 28)
        for _ in range(session_events):
            ts = now - timedelta(minutes=random.randint(0, 30), seconds=random.randint(0, 59))
            interest = random.choice(prof["interests"])
            path = random.choice(PATHS + [f"/categories?category={interest}", f"/course/{random.randint(1, 12)}"])
            ev_type = random.choices(
                EVENT_TYPES,
                weights=[8, 10, 6, 6, 5, 7, 4, 3, 2, 2, 1],
                k=1,
            )[0]
            props = {
                "path": path,
                "track_name": None,
                "category": interest,
                "source": "synthetic_dag",
            }
            if ev_type == "search_query":
                props["query"] = f"{interest}-tip-{random.randint(1, 500)}"
            if ev_type == "video_open":
                props["video_id"] = f"video-{interest}-{random.randint(1, 300)}"
            if ev_type == "category_select":
                props["category"] = interest
            if ev_type == "page_view":
                props["path"] = path
            events.append(
                {
                    "type": ev_type,
                    "ts": ts.isoformat(),
                    "user_id": prof["username"],
                    "props": props,
                }
            )

    random.shuffle(events)
    with dest.open("a", encoding="utf-8") as f:
        for rec in events:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return len(events)


with DAG(
    dag_id="synthetic_events",
    start_date=datetime(2025, 1, 1),
    schedule=SYNTHETIC_SCHEDULE,
    catchup=False,
    default_args=default_args,
    max_active_runs=1,
) as dag:
    PythonOperator(
        task_id="generate_synthetic_events",
        python_callable=generate_synthetic_events,
    )
