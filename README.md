# Study Together

스터디원들이 공부한 내용을 정리하고 공유하며 토론하는 협업 플랫폼

## 배포 URL

- **Frontend**: https://study-together-six.vercel.app
- **Backend API**: https://slimy-lenore-study-together-6a7ad071.koyeb.app
- **API Docs**: https://slimy-lenore-study-together-6a7ad071.koyeb.app/docs

## 프로젝트 구조

```
study-together/
├── backend/                  # FastAPI 백엔드
│   ├── routes/               # API 라우트
│   │   ├── auth_routes.py    # 인증 (로그인/회원가입/비밀번호 재설정)
│   │   ├── studies_routes.py # 스터디 CRUD + 멤버 관리 + 가입 요청
│   │   ├── posts_routes.py   # 게시물 CRUD
│   │   ├── issues_routes.py  # 이슈 CRUD (자동 상태 계산)
│   │   ├── comments_routes.py    # 댓글 CRUD
│   │   └── notifications_routes.py # 알림 관리
│   ├── database.py           # SQLAlchemy 모델 정의
│   ├── schemas.py            # Pydantic 스키마
│   ├── auth.py               # JWT 인증 로직
│   ├── email_utils.py        # 이메일 전송 (비밀번호 재설정)
│   ├── notification_utils.py # 알림 생성 유틸리티
│   ├── main.py               # FastAPI 앱 엔트리포인트
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── pages/            # 페이지 컴포넌트
│   │   ├── components/       # 공통 컴포넌트
│   │   ├── context/          # React Context (Auth, Toast, Notification)
│   │   ├── services/         # API 클라이언트
│   │   └── styles/           # CSS 스타일
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 18, React Router, Axios, React Markdown |
| **Backend** | FastAPI, SQLAlchemy, Pydantic, JWT (python-jose) |
| **Database** | PostgreSQL (Neon Serverless) |
| **Deployment** | Vercel (Frontend) + Koyeb (Backend) + Neon (DB) |
| **Containerization** | Docker & Docker Compose (로컬 개발) |

## 주요 기능

### 스터디 관리
- 스터디 생성/수정/삭제
- 멤버 초대 (이메일) 및 가입 요청/승인/거절
- 멤버 권한 관리 (admin/member)

### 게시물 & 이슈
- Markdown 지원 게시물 작성
- 이슈 관리 (날짜 기반 자동 상태: Scheduled / In Progress / Closed)
- 댓글 및 토론

### 알림 시스템
- 댓글, 게시물, 이슈 생성 시 알림
- 가입 요청 시 관리자 알림 / 승인·거절 시 요청자 알림
- 알림 시간 한국 시간(KST) 표시
- 읽음/삭제 관리

### 인증 & 사용자
- 회원가입/로그인 (JWT)
- 비밀번호 재설정 (이메일)
- 프로필 수정 (사용자명 변경, 비밀번호 변경)
- 15분 비활동 시 자동 로그아웃

### 접근 제어
- 스터디 목록: 모든 사용자 조회 가능
- 이슈/게시물: 스터디 멤버만 접근 가능
- 비멤버: Study Info 조회 + 가입 요청 가능

## 시작하기 (로컬 개발)

### 사전 요구사항
- Docker & Docker Compose
- Node.js 20+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

### Docker로 실행

```bash
docker-compose up
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 환경 변수

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/study_together
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:3000
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
MAIL_PORT=587
MAIL_SERVER=smtp.gmail.com
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

## 관련 문서

- [API 명세](./API_SPECIFICATION.md)
- [프로젝트 현황](./PROJECT_STATUS.md)
