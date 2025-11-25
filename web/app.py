import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import boto3
from botocore.config import Config
from fastapi import APIRouter, FastAPI, HTTPException, Request
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
STATIC_DIR = BASE_DIR / 'static'
if STATIC_DIR.exists():
    app.mount('/static', StaticFiles(directory=STATIC_DIR), name='static')
if FRONTEND_ASSETS:
    app.mount('/assets', StaticFiles(directory=FRONTEND_ASSETS), name='frontend-assets')

BRONZE_ROOT = Path('/data/bronze/app')
BRONZE_ROOT.mkdir(parents=True, exist_ok=True)
USERS_PATH = Path(__file__).with_name('users.json')


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


api_router = APIRouter(prefix='/api')


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
