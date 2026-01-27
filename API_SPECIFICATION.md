# Study Together API 명세서

**작성일**: 2026-01-22  
**API 버전**: v1  
**Base URL**: `http://localhost:8000/api` (로컬) / `https://api.studytogether.com` (배포)

---

## 목차
1. [인증 (Authentication)](#인증-authentication)
2. [스터디 관리 (Studies)](#스터디-관리-studies)
3. [게시물 관리 (Posts)](#게시물-관리-posts)
4. [댓글 관리 (Comments)](#댓글-관리-comments)
5. [이슈 관리 (Issues)](#이슈-관리-issues)
6. [에러 처리](#에러-처리)

---

## 인증 (Authentication)

### 1. 회원가입
**POST** `/auth/register`

**요청 (Request):**
```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "securepassword123"
}
```

**응답 (Response):**
- **200 OK**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "created_at": "2026-01-22T10:00:00"
}
```

- **400 Bad Request** - 이메일 중복 또는 입력값 검증 실패
```json
{
  "detail": "Email already registered"
}
```

---

### 2. 로그인
**POST** `/auth/login`

**요청 (Request):**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**응답 (Response):**
- **200 OK**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe"
  }
}
```

- **401 Unauthorized** - 이메일 또는 비밀번호 오류
```json
{
  "detail": "Invalid email or password"
}
```

---

### 3. 로그아웃
**POST** `/auth/logout`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**응답 (Response):**
- **200 OK**
```json
{
  "message": "Successfully logged out"
}
```

---

## 스터디 관리 (Studies)

### 1. 스터디 목록 조회
**GET** `/studies`

**쿼리 파라미터 (Query Parameters):**
- `skip` (optional): 스킵할 항목 수 (기본값: 0)
- `limit` (optional): 반환할 최대 항목 수 (기본값: 10)

**응답 (Response):**
- **200 OK**
```json
{
  "total": 5,
  "items": [
    {
      "id": 1,
      "name": "Python 스터디",
      "description": "Python 심화 스터디",
      "creator_id": 1,
      "creator": {
        "id": 1,
        "username": "john_doe"
      },
      "member_count": 3,
      "created_at": "2026-01-22T10:00:00"
    }
  ]
}
```

---

### 2. 스터디 상세 조회
**GET** `/studies/{study_id}`

**응답 (Response):**
- **200 OK**
```json
{
  "id": 1,
  "name": "Python 스터디",
  "description": "Python 심화 스터디",
  "creator_id": 1,
  "creator": {
    "id": 1,
    "username": "john_doe"
  },
  "members": [
    {
      "id": 1,
      "username": "john_doe",
      "role": "admin",
      "joined_at": "2026-01-22T10:00:00"
    }
  ],
  "created_at": "2026-01-22T10:00:00"
}
```

- **404 Not Found** - 스터디 없음
```json
{
  "detail": "Study not found"
}
```

---

### 3. 스터디 생성
**POST** `/studies`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**요청 (Request):**
```json
{
  "name": "Python 스터디",
  "description": "Python 심화 스터디"
}
```

**응답 (Response):**
- **201 Created**
```json
{
  "id": 1,
  "name": "Python 스터디",
  "description": "Python 심화 스터디",
  "creator_id": 1,
  "created_at": "2026-01-22T10:00:00"
}
```

- **401 Unauthorized** - 인증 필요
```json
{
  "detail": "Not authenticated"
}
```

---

### 4. 스터디 수정
**PUT** `/studies/{study_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "name": "Python 심화 스터디",
  "description": "Python 고급 기술 학습"
}
```

**응답 (Response):**
- **200 OK** - 수정 성공
- **403 Forbidden** - 권한 없음 (생성자만 수정 가능)
```json
{
  "detail": "Not authorized to update this study"
}
```

---

### 5. 스터디 삭제
**DELETE** `/studies/{study_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**응답 (Response):**
- **204 No Content** - 삭제 성공
- **403 Forbidden** - 권한 없음

---

### 6. 스터디 멤버 추가
**POST** `/studies/{study_id}/members`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "user_id": 2
}
```

**응답 (Response):**
- **201 Created**
```json
{
  "id": 1,
  "study_id": 1,
  "user_id": 2,
  "role": "member",
  "joined_at": "2026-01-22T10:00:00"
}
```

---

### 7. 스터디 멤버 조회
**GET** `/studies/{study_id}/members`

**응답 (Response):**
- **200 OK**
```json
{
  "total": 3,
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "username": "john_doe",
      "role": "admin",
      "joined_at": "2026-01-22T10:00:00"
    }
  ]
}
```

---

## 게시물 관리 (Posts)

### 1. 게시물 목록 조회
**GET** `/studies/{study_id}/posts`

**쿼리 파라미터 (Query Parameters):**
- `skip` (optional): 스킵할 항목 수
- `limit` (optional): 반환할 최대 항목 수

**응답 (Response):**
- **200 OK**
```json
{
  "total": 5,
  "items": [
    {
      "id": 1,
      "study_id": 1,
      "title": "Python 기초 정리",
      "author": {
        "id": 1,
        "username": "john_doe"
      },
      "comment_count": 3,
      "created_at": "2026-01-22T10:00:00"
    }
  ]
}
```

---

### 2. 게시물 상세 조회
**GET** `/posts/{post_id}`

**응답 (Response):**
- **200 OK**
```json
{
  "id": 1,
  "study_id": 1,
  "title": "Python 기초 정리",
  "content": "# Python 기초\n\n## 변수...",
  "author": {
    "id": 1,
    "username": "john_doe"
  },
  "created_at": "2026-01-22T10:00:00",
  "updated_at": "2026-01-22T10:00:00",
  "comments": [
    {
      "id": 1,
      "content": "좋은 정보 감사합니다!",
      "author": {
        "id": 2,
        "username": "jane_doe"
      },
      "created_at": "2026-01-22T11:00:00"
    }
  ]
}
```

---

### 3. 게시물 작성
**POST** `/studies/{study_id}/posts`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "title": "Python 기초 정리",
  "content": "# Python 기초\n\n## 변수..."
}
```

**응답 (Response):**
- **201 Created**
```json
{
  "id": 1,
  "study_id": 1,
  "title": "Python 기초 정리",
  "content": "# Python 기초\n\n## 변수...",
  "user_id": 1,
  "created_at": "2026-01-22T10:00:00"
}
```

---

### 4. 게시물 수정
**PUT** `/posts/{post_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "title": "Python 기초 정리 (업데이트)",
  "content": "# Python 기초\n\n## 변수... (수정됨)"
}
```

**응답 (Response):**
- **200 OK** - 수정 성공
- **403 Forbidden** - 권한 없음 (작성자만 수정 가능)

---

### 5. 게시물 삭제
**DELETE** `/posts/{post_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**응답 (Response):**
- **204 No Content** - 삭제 성공
- **403 Forbidden** - 권한 없음

---

## 댓글 관리 (Comments)

### 1. 댓글 작성
**POST** `/posts/{post_id}/comments`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "content": "좋은 정보 감사합니다!"
}
```

**응답 (Response):**
- **201 Created**
```json
{
  "id": 1,
  "post_id": 1,
  "user_id": 2,
  "content": "좋은 정보 감사합니다!",
  "created_at": "2026-01-22T11:00:00"
}
```

---

### 2. 댓글 수정
**PUT** `/comments/{comment_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "content": "정말 좋은 정보 감사합니다!"
}
```

**응답 (Response):**
- **200 OK** - 수정 성공
- **403 Forbidden** - 권한 없음 (작성자만 수정 가능)

---

### 3. 댓글 삭제
**DELETE** `/comments/{comment_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**응답 (Response):**
- **204 No Content** - 삭제 성공
- **403 Forbidden** - 권한 없음

---

## 이슈 관리 (Issues)

### 1. 이슈 목록 조회 (메인 보드)
**GET** `/studies/{study_id}/issues`

**쿼리 파라미터 (Query Parameters):**
- `status` (optional): 상태 필터 (Open, In Progress, Closed)
- `skip` (optional): 스킵할 항목 수
- `limit` (optional): 반환할 최대 항목 수

**응답 (Response):**
- **200 OK**
```json
{
  "total": 5,
  "items": [
    {
      "id": 1,
      "study_id": 1,
      "title": "Python 심화 학습 필요",
      "status": "Open",
      "author": {
        "id": 1,
        "username": "john_doe"
      },
      "created_at": "2026-01-22T10:00:00"
    }
  ]
}
```

---

### 2. 이슈 상세 조회
**GET** `/issues/{issue_id}`

**응답 (Response):**
- **200 OK**
```json
{
  "id": 1,
  "study_id": 1,
  "title": "Python 심화 학습 필요",
  "description": "리스트 컴프리헨션과 데코레이터 학습",
  "status": "Open",
  "author": {
    "id": 1,
    "username": "john_doe"
  },
  "created_at": "2026-01-22T10:00:00",
  "updated_at": "2026-01-22T10:00:00"
}
```

---

### 3. 이슈 생성
**POST** `/studies/{study_id}/issues`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "title": "Python 심화 학습 필요",
  "description": "리스트 컴프리헨션과 데코레이터 학습"
}
```

**응답 (Response):**
- **201 Created**
```json
{
  "id": 1,
  "study_id": 1,
  "title": "Python 심화 학습 필요",
  "description": "리스트 컴프리헨션과 데코레이터 학습",
  "status": "Open",
  "user_id": 1,
  "created_at": "2026-01-22T10:00:00"
}
```

---

### 4. 이슈 상태 변경
**PUT** `/issues/{issue_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**요청 (Request):**
```json
{
  "status": "In Progress"
}
```

**응답 (Response):**
- **200 OK**
```json
{
  "id": 1,
  "status": "In Progress",
  "updated_at": "2026-01-22T12:00:00"
}
```

**유효한 상태 전이:**
- `Open` → `In Progress` → `Closed`
- `Open` → `Closed` (직접 종료)
- `In Progress` → `Open` (다시 열기)

---

### 5. 이슈 삭제
**DELETE** `/issues/{issue_id}`

**헤더 (Headers):**
```
Authorization: Bearer {access_token}
```

**응답 (Response):**
- **204 No Content** - 삭제 성공
- **403 Forbidden** - 권한 없음 (생성자만 삭제 가능)

---

## 에러 처리

### 공통 에러 응답 형식

**400 Bad Request** - 입력값 검증 실패
```json
{
  "detail": "Validation error message"
}
```

**401 Unauthorized** - 인증되지 않음
```json
{
  "detail": "Not authenticated"
}
```

**403 Forbidden** - 권한 없음
```json
{
  "detail": "Not authorized"
}
```

**404 Not Found** - 리소스 없음
```json
{
  "detail": "Resource not found"
}
```

**500 Internal Server Error** - 서버 에러
```json
{
  "detail": "Internal server error"
}
```

---

## 인증 토큰 사용법

모든 보호된 엔드포인트는 `Authorization` 헤더에 JWT 토큰이 필요합니다.

```
Authorization: Bearer {access_token}
```

**예시:**
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     http://localhost:8000/api/studies
```

---

## 페이지네이션

목록 조회 API는 페이지네이션을 지원합니다.

**쿼리 파라미터:**
- `skip`: 스킵할 항목 수 (기본값: 0)
- `limit`: 반환할 최대 항목 수 (기본값: 10)

**예시:**
```
GET /api/studies?skip=0&limit=20
```

**응답:**
```json
{
  "total": 100,
  "items": [...]
}
```

---

## 테스트 방법

### Swagger UI (자동 생성)
`http://localhost:8000/docs`에서 모든 API를 테스트할 수 있습니다.

### cURL 예시

**회원가입:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"john_doe","password":"password123"}'
```

**로그인:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**스터디 목록 조회:**
```bash
curl http://localhost:8000/api/studies
```

**스터디 생성 (인증 필요):**
```bash
curl -X POST http://localhost:8000/api/studies \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Python 스터디","description":"Python 심화 스터디"}'
```
