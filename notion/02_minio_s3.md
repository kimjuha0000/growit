# **두 번째 이야기: 내 소중한 데이터를 위한 안전한 저장고, MinIO**

웹사이트에서 사용자 로그를 차곡차곡 쌓기 시작하면서 저는 꽤나 뿌듯했습니다. 매일매일 쌓이는 로그 파일을 보며, 마치 농부가 수확물을 곳간에 쌓아두는 듯한 기분이었죠. 하지만 어느 날 문득, 등골이 서늘해지는 생각이 들었습니다.

"만약 내 컴퓨터가 고장나면... 이 데이터들은 전부 사라지는 거잖아? 그리고 다른 팀원이 이 데이터를 분석하고 싶으면, 매번 내게 파일을 달라고 해야 하나?"

데이터가 한곳에만, 그것도 제 개인 컴퓨터에만 있다는 것은 너무나도 위험하고 비효율적인 방식이었습니다. 데이터를 안전하게 백업하고, 여러 사람이 함께 사용할 수 있는 '중앙 저장소'가 필요했습니다.

## **해결책을 찾아서: S3와 MinIO와의 만남**

문제 해결을 위해 조사를 시작했고, '오브젝트 스토리지'라는 개념과 만났습니다. 그중에서도 AWS S3는 업계 표준처럼 사용되고 있었죠. 하지만 저는 당장 AWS를 사용하기보다는, 제 개발 환경 안에서 직접 통제할 수 있는 무언가를 원했습니다.

그때 발견한 것이 바로 **MinIO**였습니다. MinIO는 S3와 거의 동일한 방식으로 작동하는 오픈소스 오브젝트 스토리지로, 제 개인 서버나 Docker 컨테이너에 직접 설치할 수 있었습니다. 저만의 작은 S3 서버가 생기는 셈이었죠!

MinIO를 선택한 이유는 명확했습니다.
-   **백업 및 공유**: 로그 파일을 MinIO에 복사해두면, 제 컴퓨터에 문제가 생겨도 데이터는 안전합니다. 다른 팀원들도 MinIO에 접속해 바로 데이터를 가져갈 수 있습니다.
-   **S3 호환성**: 지금은 MinIO를 쓰지만, 나중에 AWS S3로 옮겨가고 싶을 때 코드 변경이 거의 없습니다. `boto3` 같은 표준 S3 SDK를 그대로 사용할 수 있기 때문이죠.
-   **확장성**: 나중에 데이터 처리량이 늘어나 Spark 같은 분석 도구를 여러 개 동시에 실행해도, 모두 중앙 저장소인 MinIO를 바라보고 작업할 수 있어 확장이 쉬워집니다.

## **새로운 데이터 흐름 설계하기**

MinIO를 도입하면서 데이터 흐름이 조금 더 든든해졌습니다. 이제 FastAPI는 로그를 로컬 파일에 기록할 뿐만 아니라, MinIO라는 안전한 금고에 한 부 더 복사해두는 역할을 맡게 되었습니다.

```mermaid
flowchart LR
  Web[FastAPI 웹] -->|1. 일단 로컬에 기록| Local[/data/bronze/app/part-*.jsonl]
  Web -->|2. USE_MINIO=true면| Minio[(MinIO: 'logs' 버킷)]
  
  subgraph 다른 곳에서 사용
    Spark[Spark ETL] -->|데이터 읽기| Minio
    Team[다른 팀원 PC] -->|데이터 읽기| Minio
  end
```

## **코드로 구현하기: FastAPI와 MinIO의 만남**

실제 구현은 생각보다 간단했습니다. `boto3`라는 파이썬 라이브러리를 사용하면 몇 줄의 코드로 파일 업로드가 가능했죠. 먼저, 환경 변수를 사용해 MinIO 사용 여부를 제어할 수 있도록 스위치를 만들었습니다.

```python
# settings.py
# .env 파일에서 환경 변수를 읽어옴
USE_MINIO = os.getenv("USE_MINIO", "false").lower() == "true"
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "logs")
```

그리고 로그 파일을 파일에 쓴 직후, `USE_MINIO`가 `true`이면 MinIO로 업로드하는 코드를 추가했습니다.

```python
# uploader.py (단순화된 버전)
import boto3
from botocore.client import Config

def get_s3_client():
    """MinIO 클라이언트를 생성하는 함수"""
    return boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4")
    )

def upload_to_minio(local_file_path: str, object_key: str):
    """로컬 파일을 MinIO에 업로드합니다."""
    if not USE_MINIO:
        return

    try:
        s3 = get_s3_client()
        s3.upload_file(local_file_path, MINIO_BUCKET, object_key)
        print(f"성공: {local_file_path} -> MinIO 버킷 '{MINIO_BUCKET}'에 '{object_key}'로 업로드 완료")
    except Exception as e:
        print(f"실패: MinIO 업로드 중 에러 발생 - {e}")
        # 업로드에 실패해도 로컬 파일은 남아있으므로, 운영에 영향 없음
```
여기서 `object_key`는 MinIO에 저장될 파일의 경로와 이름입니다. 저는 `bronze/app/YYYY/MM/DD/part-*.jsonl` 같은 구조를 사용하여, 나중에 날짜별로 데이터를 쉽게 찾고 처리할 수 있도록 설계했습니다.

## **돌아보며: 함께 쓰는 저장소를 만들며 얻은 교훈**

-   **데이터는 분산되어 있을 때 위험하다**: 데이터의 '단일 진실 공급원(Single Source of Truth)'을 정하는 것이 왜 중요한지 깨달았습니다. 제게는 MinIO가 바로 그 역할을 해주었죠.
-   **인터페이스의 힘**: MinIO가 S3 API라는 표준 인터페이스를 따랐기 때문에, 저는 S3를 다루는 수많은 자료와 도구(boto3 등)를 그대로 활용할 수 있었습니다. 잘 만든 표준은 개발을 정말 편하게 만들어줍니다.

이제 제 데이터는 더 이상 제 컴퓨터에 갇혀 있지 않습니다. 안전하게 보관되고, 권한이 있는 사람이라면 누구든 접근할 수 있는 '공공 자산'이 되었습니다. 데이터 파이프라인의 두 번째 단계를 완성한 순간이었습니다.