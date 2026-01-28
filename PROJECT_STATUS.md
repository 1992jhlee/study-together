# Project Status

## 배포 현황

| 서비스 | 플랫폼 | URL | 상태 |
|--------|--------|-----|------|
| Frontend | Vercel | https://study-together-six.vercel.app | 운영 중 |
| Backend | Koyeb | https://slimy-lenore-study-together-6a7ad071.koyeb.app | 운영 중 |
| Database | Neon (PostgreSQL) | ap-southeast-1 (Singapore) | 운영 중 |

- GitHub 자동 배포: main 브랜치 push 시 Koyeb(백엔드) + Vercel(프론트엔드) 자동 빌드/배포

## 구현 완료 기능

### 인증 시스템
- [x] 회원가입 (이메일, 사용자명, 비밀번호)
- [x] 로그인/로그아웃 (JWT 토큰)
- [x] 비밀번호 재설정 (이메일 전송)
- [x] 인증 상태 유지 (localStorage + Axios 인터셉터)
- [x] 프로필 수정 (사용자명 변경, 비밀번호 변경)
- [x] 15분 비활동 시 자동 로그아웃

### 스터디 관리
- [x] 스터디 생성 (이름 중복 체크)
- [x] 스터디 수정/삭제 (생성자만)
- [x] 스터디 목록 조회 (모든 사용자)
- [x] 스터디 상세 조회

### 멤버 관리
- [x] 멤버 초대 (관리자가 이메일로 추가)
- [x] 멤버 삭제 (생성자만, 자기 자신 제외)
- [x] 가입 요청 (비멤버가 스터디에 가입 요청)
- [x] 가입 요청 승인/거절 (관리자)

### 접근 제어
- [x] 스터디 목록: 로그인 사용자 전체 조회 가능
- [x] 이슈/게시물: 스터디 멤버만 접근 가능 (백엔드 + 프론트엔드)
- [x] 비멤버: Study Info만 조회, View Posts 버튼 비활성화
- [x] 가입 요청 대기 상태 표시

### 게시물
- [x] 게시물 작성/수정/삭제
- [x] Markdown 렌더링
- [x] 게시물별 댓글

### 이슈
- [x] 이슈 생성/수정/삭제
- [x] 날짜 기반 자동 상태 계산 (Scheduled / In Progress / Closed)
- [x] 상태별 필터링
- [x] 이슈별 댓글

### 알림
- [x] 댓글 작성 시 게시물/이슈 작성자에게 알림
- [x] 새 게시물 생성 시 스터디 멤버에게 알림
- [x] 새 이슈 생성 시 스터디 멤버에게 알림
- [x] 가입 요청 시 스터디 관리자에게 알림
- [x] 가입 요청 승인/거절 시 요청자에게 알림
- [x] 알림 벨 아이콘 + 읽지 않은 개수 배지
- [x] 알림 읽음 처리 / 삭제
- [x] 알림 클릭 시 관련 페이지로 이동
- [x] 알림 시간 한국 시간(KST) 표시

### UI/UX
- [x] 반응형 디자인 (모바일 대응)
- [x] ErrorBoundary (에러 상세 정보 표시)
- [x] Toast 알림 (성공/에러/경고)
- [x] 로딩 스피너

## DB 모델

```
User
├── id, email, username, password
├── password_reset_token, password_reset_expires
└── created_at, updated_at

Study
├── id, name, description, creator_id
└── created_at, updated_at

StudyMember
├── id, study_id, user_id, role (admin/member)
└── joined_at

Post
├── id, study_id, user_id, title, content
└── created_at, updated_at

Issue
├── id, study_id, user_id, title, description
├── status, start_date, end_date
└── created_at, updated_at

Comment
├── id, post_id (nullable), issue_id (nullable), user_id, content
└── created_at, updated_at

Notification
├── id, user_id, notification_type, message
├── post_id, issue_id, study_id, from_user_id
├── is_read
└── created_at

JoinRequest
├── id, study_id, user_id, status (pending/approved/rejected)
├── reviewed_at, reviewed_by
└── created_at
```

## 해결된 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| Koyeb 빌드 실패 | Dockerfile COPY 경로 (빌드 컨텍스트가 repo root) | `COPY backend/requirements.txt .` 로 수정 |
| Vercel 빌드 실패 | react-scripts 5.0.1 + Node 22 호환성 | Node 20.x + `NODE_OPTIONS=--openssl-legacy-provider` |
| 로그인 에러 메시지 안보임 | 401 인터셉터가 로그인 실패에도 리다이렉트 | auth 엔드포인트 제외 처리 |
| 스터디 이름 중복 | 중복 체크 없음 | `create_study`에 이름 중복 체크 추가 |
| 스터디 삭제 실패 | FK 제약조건 (Notification, Comment) | 관련 레코드 수동 삭제 후 스터디 삭제 |
| 모바일 회원가입 크래시 | `alert()` 일부 인앱 브라우저에서 에러 | `navigate` state로 대체 |
| 모바일 스터디 목록 안보임 | CSS `display: none` on sidebar | flex 레이아웃으로 변경 |
