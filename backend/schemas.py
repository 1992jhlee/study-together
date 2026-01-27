from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date

# ==================== User Schemas ====================

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserInDB(UserResponse):
    password: str


# ==================== Study Schemas ====================

class StudyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

class StudyCreate(StudyBase):
    pass

class StudyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

class StudyResponse(StudyBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StudyDetailResponse(StudyResponse):
    creator: UserResponse
    member_count: int = 0
    members: Optional[List['StudyMemberResponse']] = None


# ==================== Study Member Schemas ====================

class StudyMemberBase(BaseModel):
    user_id: int
    role: str = "member"

class StudyMemberCreate(BaseModel):
    email: EmailStr

class StudyMemberResponse(BaseModel):
    id: int
    study_id: int
    user_id: int
    role: str
    joined_at: datetime
    
    class Config:
        from_attributes = True

class StudyMemberWithUserResponse(StudyMemberResponse):
    user: Optional[UserResponse] = None


# ==================== Post Schemas ====================

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)

class PostResponse(PostBase):
    id: int
    study_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PostDetailResponse(PostResponse):
    author: Optional[UserResponse] = None
    comments: Optional[List['CommentResponse']] = None
    comment_count: int = 0

class PostListItemResponse(BaseModel):
    id: int
    study_id: int
    title: str
    author: Optional[UserResponse] = None
    comment_count: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Comment Schemas ====================

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class CommentResponse(CommentBase):
    id: int
    post_id: Optional[int] = None
    issue_id: Optional[int] = None
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CommentDetailResponse(CommentResponse):
    author: Optional[UserResponse] = None


# ==================== Issue Schemas ====================

class IssueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)

class IssueCreate(IssueBase):
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class IssueUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class IssueResponse(IssueBase):
    id: int
    study_id: int
    user_id: int
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class IssueDetailResponse(IssueResponse):
    author: Optional[UserResponse] = None
    comments: Optional[List['CommentDetailResponse']] = None
    comment_count: int = 0

class IssueListItemResponse(BaseModel):
    id: int
    study_id: int
    title: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    author: Optional[UserResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Auth Schemas ====================

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None


# ==================== Password Reset Schemas ====================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    reset_link: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

class ResetPasswordResponse(BaseModel):
    message: str


# ==================== Notification Schemas ====================

class NotificationBase(BaseModel):
    notification_type: str
    message: str

class NotificationCreate(NotificationBase):
    user_id: int
    post_id: Optional[int] = None
    issue_id: Optional[int] = None
    study_id: Optional[int] = None
    from_user_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    post_id: Optional[int] = None
    issue_id: Optional[int] = None
    study_id: Optional[int] = None
    from_user_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    from_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    items: List[NotificationResponse]

class NotificationMarkReadRequest(BaseModel):
    notification_ids: Optional[List[int]] = None  # None이면 전체 읽음 처리


# ==================== Pagination Schemas ====================

class PaginatedResponse(BaseModel):
    total: int
    items: List

    class Config:
        arbitrary_types_allowed = True


# Update forward references
StudyDetailResponse.model_rebuild()
StudyMemberResponse.model_rebuild()
PostDetailResponse.model_rebuild()
CommentDetailResponse.model_rebuild()
IssueDetailResponse.model_rebuild()
