from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from typing import Optional
from database import get_db, Comment, User, Post, Issue
from schemas import CommentCreate, CommentUpdate, CommentResponse
from auth import get_current_user
from notification_utils import create_notification

router = APIRouter(prefix="/comments", tags=["comments"])


# ==================== 포스트 댓글 작성 ====================
@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment: CommentCreate,
    post_id: Optional[int] = None,
    issue_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    댓글 작성 (포스트 또는 이슈)

    - **post_id**: 게시물 ID (쿼리 파라미터) - 포스트 댓글일 경우
    - **issue_id**: 이슈 ID (쿼리 파라미터) - 이슈 댓글일 경우
    - **content**: 댓글 내용
    """
    if not post_id and not issue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either post_id or issue_id must be provided"
        )

    if post_id and issue_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot provide both post_id and issue_id"
        )

    if post_id:
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found"
            )
        db_comment = Comment(
            post_id=post_id,
            user_id=current_user.id,
            content=comment.content
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)

        # 알림: 게시물 작성자에게 알림
        if post.user_id != current_user.id:
            create_notification(
                db=db,
                user_id=post.user_id,
                notification_type="post_comment",
                message=f"{current_user.username}님이 '{post.title}' 게시물에 댓글을 남겼습니다.",
                post_id=post_id,
                study_id=post.study_id,
                from_user_id=current_user.id
            )
            db.commit()
    else:
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )
        db_comment = Comment(
            issue_id=issue_id,
            user_id=current_user.id,
            content=comment.content
        )
        db.add(db_comment)
        db.commit()
        db.refresh(db_comment)

        # 알림: 이슈 작성자에게 알림
        if issue.user_id != current_user.id:
            create_notification(
                db=db,
                user_id=issue.user_id,
                notification_type="issue_comment",
                message=f"{current_user.username}님이 '{issue.title}' 이슈에 댓글을 남겼습니다.",
                issue_id=issue_id,
                study_id=issue.study_id,
                from_user_id=current_user.id
            )
            db.commit()

    return db_comment


# ==================== 댓글 수정 ====================
@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    댓글 수정 (작성자만 가능)
    
    - **comment_id**: 댓글 ID
    - **content**: 새로운 댓글 내용
    """
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not db_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    db_comment.content = comment_update.content
    
    db.commit()
    db.refresh(db_comment)
    
    return db_comment


# ==================== 댓글 삭제 ====================
@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    댓글 삭제 (작성자만 가능)
    
    - **comment_id**: 댓글 ID
    """
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    
    if not db_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    db.delete(db_comment)
    db.commit()
