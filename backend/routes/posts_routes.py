from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db, Post, User, Study, Comment, StudyMember
from schemas import (
    PostCreate, PostUpdate, PostResponse, PostDetailResponse, PostListItemResponse
)
from auth import get_current_user
from notification_utils import notify_study_members

router = APIRouter(prefix="/posts", tags=["posts"])


# ==================== 스터디별 게시물 목록 조회 ====================
@router.get("/study/{study_id}", response_model=dict)
async def get_study_posts(
    study_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디별 게시물 목록 조회 (멤버만 가능)
    """
    study = db.query(Study).filter(Study.id == study_id).first()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )

    # 멤버 여부 확인
    is_member = db.query(StudyMember).filter(
        StudyMember.study_id == study_id,
        StudyMember.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="스터디 멤버만 게시물을 조회할 수 있습니다"
        )
    
    total = db.query(Post).filter(Post.study_id == study_id).count()
    posts = db.query(Post).filter(Post.study_id == study_id).offset(skip).limit(limit).all()
    
    items = []
    for post in posts:
        comment_count = db.query(Comment).filter(Comment.post_id == post.id).count()
        items.append({
            "id": post.id,
            "study_id": post.study_id,
            "title": post.title,
            "author": {
                "id": post.user.id,
                "username": post.user.username
            },
            "comment_count": comment_count,
            "created_at": post.created_at.isoformat()
        })
    
    return {"total": total, "items": items}


# ==================== 게시물 상세 조회 ====================
@router.get("/{post_id}", response_model=dict)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """
    게시물 상세 조회 (댓글 포함)
    
    - **post_id**: 게시물 ID
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comments = db.query(Comment).filter(Comment.post_id == post_id).all()
    comments_data = []
    
    for comment in comments:
        comments_data.append({
            "id": comment.id,
            "content": comment.content,
            "author": {
                "id": comment.user.id,
                "username": comment.user.username
            },
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat()
        })
    
    return {
        "id": post.id,
        "study_id": post.study_id,
        "title": post.title,
        "content": post.content,
        "author": {
            "id": post.user.id,
            "username": post.user.username
        },
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
        "comments": comments_data,
        "comment_count": len(comments_data)
    }


# ==================== 게시물 작성 ====================
@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    study_id: int,
    post: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    게시물 작성
    
    - **study_id**: 스터디 ID (쿼리 파라미터)
    - **title**: 게시물 제목
    - **content**: 게시물 내용 (Markdown 형식)
    """
    study = db.query(Study).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    db_post = Post(
        study_id=study_id,
        user_id=current_user.id,
        title=post.title,
        content=post.content
    )

    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # 스터디 멤버들에게 알림
    notify_study_members(
        db=db,
        study_id=study_id,
        notification_type="new_post",
        message=f"{current_user.username}님이 새 게시물 '{post.title}'을 작성했습니다.",
        exclude_user_id=current_user.id,
        post_id=db_post.id,
        from_user_id=current_user.id
    )
    db.commit()

    return db_post


# ==================== 게시물 수정 ====================
@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    게시물 수정 (작성자만 가능)
    
    - **post_id**: 게시물 ID
    - **title**: 새로운 제목 (선택사항)
    - **content**: 새로운 내용 (선택사항)
    """
    db_post = db.query(Post).filter(Post.id == post_id).first()
    
    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if db_post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    if post_update.title is not None:
        db_post.title = post_update.title
    if post_update.content is not None:
        db_post.content = post_update.content
    
    db.commit()
    db.refresh(db_post)
    
    return db_post


# ==================== 게시물 삭제 ====================
@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    게시물 삭제 (작성자만 가능)
    
    - **post_id**: 게시물 ID
    """
    db_post = db.query(Post).filter(Post.id == post_id).first()
    
    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if db_post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    db.delete(db_post)
    db.commit()
