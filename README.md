# Study Together

공동 공간에서 스터디원들이 공부한 내용을 정리하고 공유하며 discussion하는 애플리케이션

## 프로젝트 구조

```
study-together/
├── backend/          (FastAPI)
├── frontend/         (React)
├── docker-compose.yml
└── README.md
```

## 기술 스택

- **Frontend**: React
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Deployment**: Vercel (Frontend) + Render (Backend)
- **Containerization**: Docker & Docker Compose

## 주요 기능

1. 스터디 문서 공유 (Markdown)
2. 문서에 댓글 및 Discussion
3. 스터디 관련 Issue/Board 관리

## 시작하기

### 사전 요구사항
- Docker & Docker Compose
- Node.js 16+ (로컬 개발시)
- Python 3.9+ (로컬 개발시)

### 개발 서버 실행

```bash
docker-compose up
```

Frontend: http://localhost:3000
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs

## 개발 일정

- [ ] Docker 환경 설정
- [ ] Database 설계
- [ ] API 명세 정의
- [ ] 코드 스캐폴딩
- [ ] 백엔드 개발
- [ ] 프론트엔드 개발
- [ ] 테스트 및 배포
