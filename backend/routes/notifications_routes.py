from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from database import get_db, Notification, User
from schemas import NotificationResponse, NotificationListResponse, NotificationMarkReadRequest
from auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 알림 목록 조회

    - **skip**: 스킵할 항목 수
    - **limit**: 반환할 최대 항목 수
    - **unread_only**: 읽지 않은 알림만 조회
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    items = []
    for notification in notifications:
        item = {
            "id": notification.id,
            "user_id": notification.user_id,
            "notification_type": notification.notification_type,
            "message": notification.message,
            "post_id": notification.post_id,
            "issue_id": notification.issue_id,
            "study_id": notification.study_id,
            "from_user_id": notification.from_user_id,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
            "from_user": {
                "id": notification.from_user.id,
                "username": notification.from_user.username,
                "email": notification.from_user.email,
                "created_at": notification.from_user.created_at
            } if notification.from_user else None
        }
        items.append(item)

    return {
        "total": total,
        "unread_count": unread_count,
        "items": items
    }


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """읽지 않은 알림 개수 조회"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {"unread_count": count}


@router.put("/read")
async def mark_notifications_read(
    request: NotificationMarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    알림 읽음 처리

    - **notification_ids**: 읽음 처리할 알림 ID 목록 (없으면 전체)
    """
    query = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )

    if request.notification_ids:
        query = query.filter(Notification.id.in_(request.notification_ids))

    updated_count = query.update({"is_read": True}, synchronize_session=False)
    db.commit()

    return {"updated_count": updated_count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """알림 삭제"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """모든 알림 삭제"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).delete()
    db.commit()
