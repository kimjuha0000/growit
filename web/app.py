import json
import os
import random
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config
import pendulum
import requests
from fastapi import APIRouter, BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from filelock import FileLock
from pydantic import BaseModel

USE_MINIO = os.getenv('USE_MINIO', 'false').lower() == 'true'
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', 'http://minio:9000')
MINIO_ACCESS = os.getenv('MINIO_ACCESS_KEY', 'admin')
MINIO_SECRET = os.getenv('MINIO_SECRET_KEY', 'admin12345')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'logs')

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_CANDIDATES = [
    PROJECT_ROOT / 'growit' / 'dist',
    PROJECT_ROOT / 'growit' / 'growit' / 'dist',
    PROJECT_ROOT / 'growit' / 'green-learning-hub-main' / 'dist',
]
FRONTEND_DIST = next((candidate for candidate in FRONTEND_CANDIDATES if candidate.exists()), None)
FRONTEND_ASSETS = FRONTEND_DIST / 'assets' if FRONTEND_DIST and (FRONTEND_DIST / 'assets').exists() else None

app = FastAPI()
default_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3300',
    'http://127.0.0.1:3300',
]
env_origins = os.getenv('CORS_ALLOW_ORIGINS')
allowed_origins = [origin.strip() for origin in (env_origins.split(',') if env_origins else default_origins) if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
STATIC_DIR = BASE_DIR / 'static'
if STATIC_DIR.exists():
    app.mount('/static', StaticFiles(directory=STATIC_DIR), name='static')
if FRONTEND_ASSETS:
    app.mount('/assets', StaticFiles(directory=FRONTEND_ASSETS), name='frontend-assets')

BRONZE_ROOT = Path('/data/bronze/app')
BRONZE_ROOT.mkdir(parents=True, exist_ok=True)
USERS_PATH = Path(__file__).with_name('users.json')
TRAFFIC_DEFAULT_TARGET = os.getenv('TRAFFIC_TARGET_URL', 'http://web:3000/api/events')
TRAFFIC_MAX_REQUESTS = 20000
TRAFFIC_MAX_CONCURRENCY = 200
traffic_state: dict[str, Any] = {
    'status': 'idle',
    'message': 'ready',
    'last_started': None,
    'last_finished': None,
    'summary': {},
}
traffic_lock = threading.Lock()
TRAFFIC_ACTIONS = ['login', 'view_home', 'search', 'view_product', 'cart', 'checkout', 'logout']
TRAFFIC_PATHS = ['/', '/feed', '/product/1', '/product/2', '/cart', '/checkout']
TRAFFIC_UA = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (Linux; x86_64)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)',
    'Mozilla/5.0 (Android 14; Mobile)',
]


def _build_courses(slug: str, theme: str, providers: list[str], levels: list[str], durations: list[str], total: int = 100):
    courses = []
    for idx in range(1, total + 1):
        courses.append(
            {
                'title': f'{theme} 트랙 {idx:03d}',
                'provider': providers[(idx - 1) % len(providers)],
                'duration': durations[(idx - 1) % len(durations)],
                'level': levels[(idx - 1) % len(levels)],
                'url': f'https://academy.learningpipeline.com/{slug}/course-{idx:03d}',
            }
        )
    return courses


CATEGORY_BLUEPRINTS = [
    {
        'slug': 'data-engineering',
        'name': '데이터 엔지니어링',
        'description': '배치/스트리밍 파이프라인과 데이터 품질 관리',
        'theme': '데이터 파이프라인',
        'icon': '🧱',
        'accent': '#4f46e5',
        'providers': ['FastCampus', 'Udemy', 'Coursera', 'DataBricks', 'Inflearn'],
        'levels': ['초급', '중급', '고급', '실무'],
        'durations': ['2주', '3주', '4주', '6주', '40시간'],
    },
    {
        'slug': 'ai-labs',
        'name': 'AI 랩 실습',
        'description': 'LLM·멀티모달 실험과 모델 서빙',
        'theme': 'AI 실험',
        'icon': '🤖',
        'accent': '#f97316',
        'providers': ['deeplearning.ai', '모두의연구소', 'FastCampus', 'Google Cloud Skill Boost'],
        'levels': ['입문', '초급', '중급', '실무'],
        'durations': ['1주', '2주', '3주', '5주', '20시간'],
    },
    {
        'slug': 'marketing',
        'name': '그로스 마케팅',
        'description': '데이터 기반 캠페인 설계와 퍼널 분석',
        'theme': '그로스 실전',
        'icon': '📈',
        'accent': '#10b981',
        'providers': ['Reforge', '패스트캠퍼스', 'Udacity', 'HubSpot Academy'],
        'levels': ['초급', '중급', '고급'],
        'durations': ['2주', '3주', '4주', '6주'],
    },
    {
        'slug': 'product-design',
        'name': '프로덕트 디자인',
        'description': '사용자 여정 설계와 UI 시스템',
        'theme': 'UX 디자인',
        'icon': '🎨',
        'accent': '#ec4899',
        'providers': ['Figma Academy', '라이징캠프', 'IDEO U', 'Coursera'],
        'levels': ['입문', '초급', '중급'],
        'durations': ['2주', '3주', '5주', '30시간'],
    },
    {
        'slug': 'backend',
        'name': '백엔드 엔지니어링',
        'description': 'API 설계와 데이터 접근 계층',
        'theme': '백엔드 마스터',
        'icon': '🛠️',
        'accent': '#0ea5e9',
        'providers': ['Inflearn', 'edX', 'Udemy', 'AWS Skill Builder'],
        'levels': ['초급', '중급', '고급'],
        'durations': ['5시간', '10시간', '3주', '5주'],
    },
    {
        'slug': 'cloud-platforms',
        'name': '클라우드 플랫폼',
        'description': 'AWS·Azure·GCP 인프라와 보안 운영',
        'theme': '클라우드 아키텍트',
        'icon': '☁️',
        'accent': '#38bdf8',
        'providers': ['AWS Skill Builder', 'Azure Learn', 'Google Cloud', 'FastCampus'],
        'levels': ['입문', '초급', '중급', '전문가'],
        'durations': ['2주', '4주', '6주', '8주'],
    },
    {
        'slug': 'analytics',
        'name': '데이터 분석',
        'description': 'BI 대시보드부터 실험 설계까지',
        'theme': '분석 리더',
        'icon': '📊',
        'accent': '#22c55e',
        'providers': ['Coursera', 'Datacamp', 'Mode', 'Udacity'],
        'levels': ['입문', '초급', '중급', '고급'],
        'durations': ['1주', '2주', '4주', '40시간'],
    },
    {
        'slug': 'devops',
        'name': 'DevOps & SRE',
        'description': 'CI/CD, IaC, 모니터링 자동화',
        'theme': '플랫폼 운영',
        'icon': '⚙️',
        'accent': '#facc15',
        'providers': ['HashiCorp', 'Linux Foundation', 'Google Cloud', 'Udemy'],
        'levels': ['초급', '중급', '고급'],
        'durations': ['1주', '2주', '3주', '5주'],
    },
    {
        'slug': 'mobile',
        'name': '모바일 앱',
        'description': 'Flutter·React Native·네이티브 앱 구축',
        'theme': '모바일 빌더',
        'icon': '📱',
        'accent': '#a855f7',
        'providers': ['Udacity', 'Kodeco', 'Inflearn', 'Coursera'],
        'levels': ['입문', '초급', '중급'],
        'durations': ['1주', '3주', '5주', '8주'],
    },
    {
        'slug': 'business-intelligence',
        'name': '비즈니스 인텔리전스',
        'description': '임원용 리포팅과 지표 설계',
        'theme': 'BI 전략',
        'icon': '🧠',
        'accent': '#fb7185',
        'providers': ['Tableau', 'Looker', 'PowerBI', 'LinkedIn Learning'],
        'levels': ['초급', '중급', '고급'],
        'durations': ['2주', '3주', '4주', '6주'],
    },
]

COURSE_CATALOG: dict[str, dict[str, Any]] = {}
for blueprint in CATEGORY_BLUEPRINTS:
    COURSE_CATALOG[blueprint['slug']] = {
        'name': blueprint['name'],
        'description': blueprint['description'],
        'icon': blueprint['icon'],
        'accent': blueprint['accent'],
        'courses': _build_courses(
            blueprint['slug'],
            blueprint['theme'],
            blueprint['providers'],
            blueprint['levels'],
            blueprint['durations'],
        ),
    }


def _ensure_dir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)


def _local_bronze_path(now: datetime) -> Path:
    y, m, d, hh = now.strftime('%Y'), now.strftime('%m'), now.strftime('%d'), now.strftime('%H')
    folder = BRONZE_ROOT / y / m / d
    _ensure_dir(folder)
    return folder / f'part-{y}{m}{d}-{hh}.jsonl'


def _append_jsonl_line(dest: Path, line: str):
    lock = FileLock(str(dest) + '.lock')
    with lock:
        with dest.open('a', encoding='utf-8') as f:
            if not line.endswith('\n'):
                line += '\n'
            f.write(line)


def _minio_upload_whole_file(dest: Path, now: datetime):
    key = f"bronze/app/{now.strftime('%Y/%m/%d')}/{dest.name}"
    s3 = boto3.client(
        's3',
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS,
        aws_secret_access_key=MINIO_SECRET,
        config=Config(s3={'addressing_style': 'path'}, retries={'max_attempts': 3}),
        region_name='us-east-1',
    )
    s3.upload_file(str(dest), MINIO_BUCKET, key)
    return key


def _load_users() -> list[dict[str, Any]]:
    if not USERS_PATH.exists():
        return []
    with USERS_PATH.open(encoding='utf-8') as f:
        return json.load(f)


def _get_user(username: str) -> dict[str, Any] | None:
    for user in _load_users():
        if user['username'] == username:
            return user
    return None


def _verify_credentials(username: str, password: str) -> dict[str, Any]:
    user = _get_user(username)
    if not user or user['password'] != password:
        raise HTTPException(status_code=401, detail='아이디 혹은 비밀번호가 올바르지 않습니다.')
    return user


def _log_event(event_type: str, username: str, payload: dict[str, Any], req: Request):
    now = datetime.now(timezone.utc)
    rec = {
        'type': event_type,
        'ts': now.isoformat(),
        'user_id': username,
        'props': payload,
        '_server': {
            'received_ts': now.isoformat(),
            'ip': req.client.host if req.client else None,
            'ua': req.headers.get('user-agent'),
        },
    }
    dest = _local_bronze_path(now)
    _append_jsonl_line(dest, json.dumps(rec, ensure_ascii=False))
    if USE_MINIO:
        _minio_upload_whole_file(dest, now)


class LoginRequest(BaseModel):
    username: str
    password: str


class RecommendationRequest(BaseModel):
    username: str
    category: str


class CustomEventRequest(BaseModel):
    event_type: str
    metadata: dict[str, Any] | None = None
    username: str | None = None


class TrafficTrigger(BaseModel):
    target_url: str | None = None
    total_requests: int = 1000
    concurrency: int = 50
    user_pool: int = 2000
    method: str = 'POST'
    timeout_seconds: float = 5.0


def _update_traffic_state(status: str, message: str, summary: dict[str, Any] | None = None):
    with traffic_lock:
        traffic_state['status'] = status
        traffic_state['message'] = message
        traffic_state['summary'] = summary or {}
        now = pendulum.now('Asia/Seoul').isoformat()
        if status == 'running':
            traffic_state['last_started'] = now
        elif status in {'ok', 'error'}:
            traffic_state['last_finished'] = now


def _run_traffic_spike(conf: TrafficTrigger):
    target = conf.target_url or TRAFFIC_DEFAULT_TARGET
    if not target:
        _update_traffic_state('error', 'target_url 혹은 TRAFFIC_TARGET_URL이 필요합니다.')
        return
    if conf.total_requests > TRAFFIC_MAX_REQUESTS or conf.concurrency > TRAFFIC_MAX_CONCURRENCY:
        _update_traffic_state('error', f'요청 제한 초과 (<= {TRAFFIC_MAX_REQUESTS}건, 동시 {TRAFFIC_MAX_CONCURRENCY} 이하)')
        return

    method = conf.method.upper()
    if method not in {'GET', 'POST'}:
        _update_traffic_state('error', 'method는 GET 또는 POST만 허용됩니다.')
        return

    _update_traffic_state(
        'running',
        f'{target} 로 총 {conf.total_requests}건, 동시 {conf.concurrency}개 전송 중',
        {'target': target, 'total': conf.total_requests, 'concurrency': conf.concurrency},
    )

    def _fire_once(idx: int):
        user_id = f'user-{idx % conf.user_pool:05d}'
        event_type = random.choice(TRAFFIC_ACTIONS)
        payload = {
            'event_type': event_type,
            'metadata': {
                'path': random.choice(TRAFFIC_PATHS),
                'ts': pendulum.now('Asia/Seoul').to_iso8601_string(),
            },
            'username': user_id,
        }
        headers = {
            'X-User-Id': user_id,
            'User-Agent': random.choice(TRAFFIC_UA),
            'X-Load-Test': 'traffic_button',
        }
        try:
            if method == 'GET':
                resp = requests.get(target, params=payload, headers=headers, timeout=conf.timeout_seconds)
            else:
                resp = requests.post(target, json=payload, headers=headers, timeout=conf.timeout_seconds)
            resp.raise_for_status()
            return True, resp.status_code
        except Exception as exc:  # noqa: BLE001
            return False, str(exc)

    start = time.time()
    successes = 0
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=conf.concurrency) as pool:
        futures = [pool.submit(_fire_once, idx) for idx in range(conf.total_requests)]
        for fut in as_completed(futures):
            ok, detail = fut.result()
            if ok:
                successes += 1
            else:
                failures.append(detail)

    elapsed = time.time() - start
    rps = successes / elapsed if elapsed else successes
    summary = {
        'target': target,
        'sent': conf.total_requests,
        'success': successes,
        'failed': len(failures),
        'duration_sec': round(elapsed, 2),
        'approx_rps': round(rps, 1),
        'sample_failures': failures[:5],
    }
    status = 'ok' if successes else 'error'
    message = '모든 요청 실패' if successes == 0 else f'완료 ({successes}/{conf.total_requests}, {round(rps,1)} rps)'
    _update_traffic_state(status, message, summary)


def _frontend_index_path() -> Path | None:
    if FRONTEND_DIST:
        candidate = FRONTEND_DIST / 'index.html'
        if candidate.exists():
            return candidate
    fallback = STATIC_DIR / 'index.html'
    return fallback if fallback.exists() else None


def _serve_frontend_index():
    idx = _frontend_index_path()
    if not idx:
        raise HTTPException(status_code=404, detail='프런트엔드 빌드가 준비되지 않았습니다.')
    return FileResponse(idx)


def _serve_frontend_asset(path: str) -> FileResponse | None:
    if not FRONTEND_DIST:
        return None
    candidate = (FRONTEND_DIST / path).resolve()
    try:
        candidate.relative_to(FRONTEND_DIST)
    except ValueError:
        return None
    if candidate.exists() and candidate.is_file():
        return FileResponse(candidate)
    return None


# --- Admin Dashboard API ---
import psycopg2
from psycopg2.extras import RealDictCursor

# Database connection details from environment variables
DB_HOST = os.getenv('POSTGRES_HOST', 'postgres')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')
DB_NAME = os.getenv('POSTGRES_DB', 'dwh')
DB_USER = os.getenv('POSTGRES_USER', 'analytics')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'devpass')

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error connecting to database: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection error: {e}")


admin_router = APIRouter(prefix='/api/admin')

@admin_router.get('/stats')
def get_pipeline_stats():
    # 1. Raw data stats
    raw_files = 0
    raw_lines = 0
    recent_files = []
    try:
        for root, _, files in os.walk(BRONZE_ROOT):
            for file in files:
                if file.endswith('.jsonl'):
                    raw_files += 1
                    full_path = Path(root) / file
                    if len(recent_files) < 5:
                         recent_files.append(str(full_path.relative_to(BRONZE_ROOT)))
                    with full_path.open('r', encoding='utf-8') as f:
                        raw_lines += sum(1 for _ in f)
    except Exception as e:
        print(f"Could not read raw data stats: {e}")


    # 2. Processed data stats
    processed_rows = 0
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Check if table exists first
            cur.execute("SELECT to_regclass('mart.daily_events')")
            if cur.fetchone()[0]:
                cur.execute('SELECT COUNT(*) FROM mart.daily_events')
                processed_rows = cur.fetchone()[0]
    except Exception as e:
        print(f"Could not read processed data stats: {e}")
    finally:
        if conn:
            conn.close()

    return {
        'raw_data': {'file_count': raw_files, 'line_count': raw_lines, 'recent_files': recent_files},
        'processed_data': {'row_count': processed_rows},
        'last_updated': datetime.now(timezone.utc).isoformat()
    }


@admin_router.get('/raw-data-sample')
def get_raw_data_sample(lines: int = 10):
    try:
        all_files = [p for p in BRONZE_ROOT.rglob('*.jsonl')]
        if not all_files:
            return {'lines': ['No raw data found.']}
        
        latest_file = max(all_files, key=lambda p: p.stat().st_mtime)
        
        with latest_file.open('r', encoding='utf-8') as f:
            content = f.readlines()
        
        return {
            'file': str(latest_file.relative_to(BRONZE_ROOT)),
            'lines': [line.strip() for line in content[-lines:]]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not read raw data sample: {e}")


class QueryRequest(BaseModel):
    sql: str

@admin_router.post('/query')
def execute_sql_query(payload: QueryRequest):
    query = payload.sql.strip()
    if not query.lower().startswith('select'):
        raise HTTPException(status_code=400, detail="Only SELECT queries are allowed.")

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
        return {'columns': columns, 'rows': rows}
    except Exception as e:
        # Be careful with exposing raw DB errors
        error_message = str(e).split('\n')[0] 
        raise HTTPException(status_code=400, detail=f"Query failed: {error_message}")
    finally:
        if conn:
            conn.close()

# --- End Admin Dashboard API ---


api_router = APIRouter(prefix='/api')


@api_router.post('/traffic/trigger')
async def trigger_traffic(payload: TrafficTrigger, background: BackgroundTasks):
    _update_traffic_state('queued', '버튼 트리거 수신, 전송 준비 중', payload.dict())
    background.add_task(_run_traffic_spike, payload)
    return {'ok': True, 'state': traffic_state}


@api_router.get('/traffic/status')
def traffic_status():
    with traffic_lock:
        return traffic_state.copy()


@api_router.post('/login')
async def api_login(payload: LoginRequest, req: Request):
    user = _verify_credentials(payload.username, payload.password)
    _log_event('login', user['username'], {'interests': user.get('interests', [])}, req)
    return {
        'ok': True,
        'username': user['username'],
        'full_name': user['full_name'],
        'interests': user.get('interests', []),
    }


@api_router.get('/categories')
def list_categories():
    items = [
        {
            'id': key,
            'name': info['name'],
            'description': info['description'],
            'courseCount': len(info['courses']),
            'icon': info.get('icon'),
            'accent': info.get('accent'),
            'sampleUrl': info['courses'][0]['url'] if info['courses'] else None,
        }
        for key, info in COURSE_CATALOG.items()
    ]
    return {'items': items}


@api_router.post('/recommendations')
async def recommend(payload: RecommendationRequest, req: Request):
    user = _get_user(payload.username)
    if not user:
        raise HTTPException(status_code=404, detail='사용자를 찾을 수 없습니다.')
    if payload.category not in COURSE_CATALOG:
        raise HTTPException(status_code=404, detail='카테고리를 찾을 수 없습니다.')

    category = COURSE_CATALOG[payload.category]
    courses = category['courses']
    _log_event(
        'category_recommendation',
        user['username'],
        {'category': payload.category, 'course_count': len(courses)},
        req,
    )
    return {
        'category': {
            'id': payload.category,
            'name': category['name'],
            'description': category.get('description'),
            'icon': category.get('icon'),
            'accent': category.get('accent'),
        },
        'courses': courses,
    }


@api_router.post('/events')
async def record_event(payload: CustomEventRequest, req: Request):
    username = payload.username or 'anonymous'
    _log_event(payload.event_type, username, payload.metadata or {}, req)
    return {'ok': True}


app.include_router(admin_router)
app.include_router(api_router)


@app.post('/login')
async def legacy_login(payload: LoginRequest, req: Request):
    return await api_login(payload, req)


@app.get('/categories')
def legacy_categories():
    return list_categories()


@app.post('/recommendations')
async def legacy_recommend(payload: RecommendationRequest, req: Request):
    return await recommend(payload, req)


@app.get('/traffic', response_class=HTMLResponse)
def traffic_page():
    page = STATIC_DIR / 'traffic.html'
    if page.exists():
        return FileResponse(page)
    raise HTTPException(status_code=404, detail='traffic.html이 없습니다.')


@app.get('/', response_class=HTMLResponse)
def home():
    return _serve_frontend_index()


@app.get('/{full_path:path}', response_class=HTMLResponse)
def spa_router(full_path: str):
    if full_path.startswith('api/'):
        raise HTTPException(status_code=404, detail='API 경로를 찾을 수 없습니다.')
    asset = _serve_frontend_asset(full_path)
    if asset:
        return asset
    return _serve_frontend_index()
