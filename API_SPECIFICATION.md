# API Specification

Base URL: `/api`

## 인증 (Auth)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/auth/register` | 회원가입 | - |
| POST | `/auth/login` | 로그인 | - |
| POST | `/auth/logout` | 로그아웃 | O |
| GET | `/auth/me` | 현재 사용자 정보 | O |
| PUT | `/auth/me` | 프로필 수정 (사용자명/비밀번호) | O |
| POST | `/auth/forgot-password` | 비밀번호 재설정 이메일 발송 | - |
| POST | `/auth/reset-password` | 비밀번호 재설정 | - |

### POST /auth/register
```json
// Request
{ "email": "user@example.com", "username": "홍길동", "password": "12345678" }

// Response 201
{ "access_token": "...", "token_type": "bearer", "user": { "id": 1, "email": "...", "username": "..." } }
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "12345678" }

// Response 200
{ "access_token": "...", "token_type": "bearer", "user": { "id": 1, "email": "...", "username": "..." } }
```

### PUT /auth/me
```json
// Request (사용자명만 변경)
{ "username": "새로운이름" }

// Request (비밀번호 변경)
{ "current_password": "현재비밀번호", "new_password": "새비밀번호123" }

// Request (사용자명 + 비밀번호 동시 변경)
{ "username": "새로운이름", "current_password": "현재비밀번호", "new_password": "새비밀번호123" }

// Response 200
{ "id": 1, "email": "user@example.com", "username": "새로운이름", "created_at": "..." }
```
- 비밀번호 변경 시 현재 비밀번호 필수
- 현재 비밀번호 불일치 시 400 에러

### POST /auth/forgot-password
```json
// Request
{ "email": "user@example.com" }

// Response 200
{ "message": "비밀번호 재설정 이메일이 발송되었습니다", "reset_link": "..." }
```

### POST /auth/reset-password
```json
// Request
{ "token": "reset-token-here", "new_password": "newpassword123" }

// Response 200
{ "message": "비밀번호가 성공적으로 변경되었습니다" }
```

---

## 스터디 (Studies)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/studies` | 스터디 목록 조회 | 선택 |
| GET | `/studies/{study_id}` | 스터디 상세 조회 | - |
| POST | `/studies` | 스터디 생성 | O |
| PUT | `/studies/{study_id}` | 스터디 수정 (생성자) | O |
| DELETE | `/studies/{study_id}` | 스터디 삭제 (생성자) | O |

### GET /studies
```
Query: skip=0, limit=10
```
```json
// Response 200
{
  "total": 5,
  "items": [
    {
      "id": 1,
      "name": "DSO 스터디",
      "description": "DevSecOps 학습",
      "creator_id": 1,
      "created_at": "2026-01-28T...",
      "updated_at": "2026-01-28T...",
      "member_count": 3,
      "is_member": true,
      "has_pending_request": false
    }
  ]
}
```

### POST /studies
```json
// Request
{ "name": "스터디 이름", "description": "스터디 설명 (선택)" }

// Response 201
{ "id": 1, "name": "...", "description": "...", "creator_id": 1, ... }
```
- 생성자가 자동으로 admin 멤버에 추가됨
- 이름 중복 시 400 에러

### GET /studies/{study_id}
```json
// Response 200
{
  "id": 1,
  "name": "DSO 스터디",
  "description": "...",
  "creator_id": 1,
  "creator": { "id": 1, "username": "admin" },
  "members": [
    { "id": 1, "username": "admin", "role": "admin", "joined_at": "..." }
  ]
}
```

---

## 멤버 관리 (Members)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/studies/{study_id}/members` | 멤버 목록 조회 | - |
| POST | `/studies/{study_id}/members` | 멤버 추가 (이메일) | O |
| DELETE | `/studies/{study_id}/members/{user_id}` | 멤버 삭제 (생성자) | O |

### POST /studies/{study_id}/members
```json
// Request
{ "email": "member@example.com" }

// Response 201
{ "id": 1, "study_id": 1, "user_id": 2, "role": "member", "joined_at": "..." }
```

---

## 가입 요청 (Join Requests)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/studies/{study_id}/join-requests` | 가입 요청 생성 | O |
| GET | `/studies/{study_id}/join-requests` | 대기 중인 요청 조회 (관리자) | O |
| PUT | `/studies/{study_id}/join-requests/{request_id}/approve` | 요청 승인 (관리자) | O |
| PUT | `/studies/{study_id}/join-requests/{request_id}/reject` | 요청 거절 (관리자) | O |

### POST /studies/{study_id}/join-requests
```json
// Response 201
{ "id": 1, "status": "pending", "message": "가입 요청이 전송되었습니다" }
```
- 이미 멤버인 경우 400 에러
- 이미 대기 중인 요청이 있는 경우 400 에러
- 스터디 관리자에게 `join_request` 알림 전송

### GET /studies/{study_id}/join-requests
```json
// Response 200 (관리자만)
{
  "total": 2,
  "items": [
    {
      "id": 1,
      "study_id": 1,
      "user_id": 3,
      "username": "홍길동",
      "email": "hong@example.com",
      "status": "pending",
      "created_at": "2026-01-28T..."
    }
  ]
}
```

### PUT /studies/{study_id}/join-requests/{request_id}/approve
```json
// Response 200
{ "message": "가입 요청이 승인되었습니다" }
```
- 승인 시 자동으로 멤버(member 역할)에 추가됨
- 요청자에게 `join_approved` 알림 전송

### PUT /studies/{study_id}/join-requests/{request_id}/reject
```json
// Response 200
{ "message": "가입 요청이 거절되었습니다" }
```
- 요청자에게 `join_rejected` 알림 전송

---

## 게시물 (Posts)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/posts/study/{study_id}` | 스터디별 게시물 목록 (멤버만) | O |
| GET | `/posts/{post_id}` | 게시물 상세 (댓글 포함) | - |
| POST | `/posts?study_id={id}` | 게시물 작성 | O |
| PUT | `/posts/{post_id}` | 게시물 수정 (작성자) | O |
| DELETE | `/posts/{post_id}` | 게시물 삭제 (작성자) | O |

### GET /posts/study/{study_id}
```
Query: skip=0, limit=10
```
```json
// Response 200
{
  "total": 10,
  "items": [
    {
      "id": 1,
      "study_id": 1,
      "title": "Week 1 정리",
      "author": { "id": 1, "username": "admin" },
      "comment_count": 3,
      "created_at": "..."
    }
  ]
}
```
- 스터디 멤버가 아니면 403 에러

### POST /posts?study_id={id}
```json
// Request
{ "title": "게시물 제목", "content": "Markdown 내용" }

// Response 201
{ "id": 1, "title": "...", "content": "...", ... }
```
- 스터디 멤버에게 알림 전송

### GET /posts/{post_id}
```json
// Response 200
{
  "id": 1,
  "title": "...",
  "content": "...",
  "author": { "id": 1, "username": "admin" },
  "comments": [
    { "id": 1, "content": "...", "author": { ... }, "created_at": "..." }
  ],
  "comment_count": 3
}
```

---

## 이슈 (Issues)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/issues/study/{study_id}` | 스터디별 이슈 목록 (멤버만) | O |
| GET | `/issues/{issue_id}` | 이슈 상세 (댓글 포함) | - |
| POST | `/issues?study_id={id}` | 이슈 생성 | O |
| PUT | `/issues/{issue_id}` | 이슈 수정 (작성자) | O |
| DELETE | `/issues/{issue_id}` | 이슈 삭제 (작성자) | O |

### GET /issues/study/{study_id}
```
Query: status_filter=Scheduled|In Progress|Closed (선택), skip=0, limit=100
```
```json
// Response 200
{
  "total": 5,
  "items": [
    {
      "id": 1,
      "title": "Sprint 1",
      "status": "In Progress",
      "start_date": "2026-01-20",
      "end_date": "2026-02-03",
      "author": { "id": 1, "username": "admin" },
      "created_at": "..."
    }
  ]
}
```
- 상태는 날짜 기반 자동 계산:
  - `Scheduled`: start_date가 미래
  - `In Progress`: start_date <= 오늘 <= end_date
  - `Closed`: end_date가 과거

### POST /issues?study_id={id}
```json
// Request
{
  "title": "이슈 제목",
  "description": "이슈 설명",
  "start_date": "2026-02-01",
  "end_date": "2026-02-15"
}

// Response 201
{ "id": 1, "title": "...", ... }
```

---

## 댓글 (Comments)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/comments?post_id={id}` | 게시물에 댓글 작성 | O |
| POST | `/comments?issue_id={id}` | 이슈에 댓글 작성 | O |
| PUT | `/comments/{comment_id}` | 댓글 수정 (작성자) | O |
| DELETE | `/comments/{comment_id}` | 댓글 삭제 (작성자) | O |

### POST /comments?post_id={id}
```json
// Request
{ "content": "댓글 내용" }

// Response 201
{ "id": 1, "content": "...", "user_id": 1, "post_id": 1, ... }
```
- 게시물/이슈 작성자에게 알림 전송

---

## 알림 (Notifications)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/notifications` | 알림 목록 조회 | O |
| GET | `/notifications/unread-count` | 읽지 않은 알림 수 | O |
| PUT | `/notifications/read` | 알림 읽음 처리 | O |
| DELETE | `/notifications/{notification_id}` | 알림 삭제 | O |
| DELETE | `/notifications` | 전체 알림 삭제 | O |

### GET /notifications
```
Query: skip=0, limit=20, unread_only=false
```
```json
// Response 200
{
  "total": 10,
  "unread_count": 3,
  "items": [
    {
      "id": 1,
      "notification_type": "post_comment",
      "message": "홍길동님이 게시물에 댓글을 남겼습니다",
      "post_id": 1,
      "study_id": 1,
      "from_user_id": 2,
      "is_read": false,
      "created_at": "..."
    }
  ]
}
```

### PUT /notifications/read
```json
// Request (특정 알림 읽음)
{ "notification_ids": [1, 2, 3] }

// Request (전체 읽음)
{ "notification_ids": null }

// Response 200
{ "message": "..." }
```

---

## 공통

### 인증 헤더
```
Authorization: Bearer <access_token>
```

### 에러 응답 형식
```json
{ "detail": "에러 메시지" }
```

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 (응답 본문 없음) |
| 400 | 잘못된 요청 (중복, 유효성 검사 실패 등) |
| 401 | 인증 필요 / 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 422 | 요청 데이터 검증 실패 |

### 알림 유형 (notification_type)

| 유형 | 설명 | 트리거 |
|------|------|--------|
| `post_comment` | 게시물 댓글 알림 | 댓글 작성 시 게시물 작성자에게 |
| `issue_comment` | 이슈 댓글 알림 | 댓글 작성 시 이슈 작성자에게 |
| `new_post` | 새 게시물 알림 | 게시물 생성 시 스터디 멤버에게 |
| `new_issue` | 새 이슈 알림 | 이슈 생성 시 스터디 멤버에게 |
| `join_request` | 가입 요청 알림 | 가입 요청 시 스터디 관리자에게 |
| `join_approved` | 가입 승인 알림 | 가입 승인 시 요청자에게 |
| `join_rejected` | 가입 거절 알림 | 가입 거절 시 요청자에게 |

### 페이지네이션
대부분의 목록 API는 `skip`과 `limit` 쿼리 파라미터를 지원합니다.
```
GET /api/studies?skip=0&limit=10
```
