# Learning Pipeline Hub

React 프론트엔드, FastAPI 백엔드, 그리고 Airflow, Spark, Delta Lake, PostgreSQL로 이어지는 현대적인 데이터 파이프라인 전체를 한 번에 체험할 수 있는 학습용 프로젝트입니다.

사용자의 웹 활동이 어떻게 데이터로 수집되고, 가공을 거쳐 분석 가능한 지표로 재탄생하는지 전 과정을 확인하고 직접 다뤄볼 수 있습니다.

**상세한 아키텍처 설명, 컨테이너별 역할, 데이터 흐름, 권한 설정 등은 [PROJECT_MANUAL.md](./PROJECT_MANUAL.md) 파일을 참고하세요.**

---

## 빠른 시작 (Quick Start)

### 1. 프로젝트 복제 및 환경 변수 설정
```bash
# 1. 프로젝트를 복제합니다.
git clone <repository-url> learning-pipeline
cd learning-pipeline

# 2. .env.example 파일을 복사하여 .env 파일을 생성합니다.
# 이 파일에는 DB, MinIO 등의 접속 정보가 포함됩니다.
cp .env.example .env
```

### 2. (최초 1회) 폴더 생성 및 권한 설정
Docker 컨테이너가 데이터를 읽고 쓸 수 있도록 호스트 머신에 폴더를 만들고 권한을 부여합니다.

- **Windows (PowerShell 관리자 권한으로 실행):**
  ```powershell
  mkdir data, pg, tmp -Force
  icacls data, pg, tmp /grant "Users:(OI)(CI)F" /T
  ```

- **macOS / Linux:**
  ```bash
  mkdir -p data pg tmp
  # 필요시 사용자/그룹 권한을 조정합니다. (예: sudo chown -R $USER:$USER data pg tmp)
  chmod -R 775 data pg tmp
  ```

### 3. Docker 서비스 전체 실행
```bash
# --build 옵션으로 이미지를 빌드하며 모든 서비스를 백그라운드에서 실행합니다.
docker compose up -d --build

# 잠시 후, 모든 서비스의 STATE가 "Up" 또는 "running"인지 확인합니다.
docker compose ps
```

### 4. 프론트엔드 빌드
```bash
# 프론트엔드 디렉토리로 이동
cd growit

# 의존성 설치
npm install

# 프로덕션용 파일 빌드 (./dist 디렉토리 생성)
npm run build
```
빌드가 완료되면 FastAPI 서버가 자동으로 새로운 프론트엔드 파일을 서빙합니다.

### 5. 접속 및 테스트
- **GrowIt 웹사이트:** `http://localhost:3300`
- **Airflow UI:** `http://localhost:8282` (admin / admin)
- **MinIO Console:** `http://localhost:9101` (admin / admin12345)
- **Spark Master UI:** `http://localhost:18181`
- **Zeppelin UI:** `http://localhost:8181`

> 💡 **프론트엔드 개발 시**
> 백엔드 서버는 그대로 둔 채 UI만 빠르게 수정하고 싶다면, `growit` 디렉토리에서 `npm run dev`를 실행하세요. 개발 서버는 `http://localhost:5173`에서 실행되며, 코드 변경 시 자동으로 화면이 갱신됩니다.

## 문제 해결
서비스가 정상적으로 실행되지 않는다면 `docker compose logs <서비스이름>` 명령어로 각 컨테이너의 로그를 확인하는 것이 가장 빠른 해결 방법입니다. (예: `docker compose logs web`)