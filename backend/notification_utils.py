from sqlalchemy.orm import Session
from database import Notification, StudyMember


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    message: str,
    post_id: int = None,
    issue_id: int = None,
    study_id: int = None,
    from_user_id: int = None
):
    """알림 생성 헬퍼 함수"""
    # 자기 자신에게는 알림 안 보냄
    if from_user_id and user_id == from_user_id:
        return None

    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        message=message,
        post_id=post_id,
        issue_id=issue_id,
        study_id=study_id,
        from_user_id=from_user_id
    )

    db.add(notification)
    return notification


def notify_study_members(
    db: Session,
    study_id: int,
    notification_type: str,
    message: str,
    exclude_user_id: int = None,
    post_id: int = None,
    issue_id: int = None,
    from_user_id: int = None
):
    """스터디 멤버들에게 알림 전송"""
    members = db.query(StudyMember).filter(StudyMember.study_id == study_id).all()

    for member in members:
        if exclude_user_id and member.user_id == exclude_user_id:
            continue

        create_notification(
            db=db,
            user_id=member.user_id,
            notification_type=notification_type,
            message=message,
            post_id=post_id,
            issue_id=issue_id,
            study_id=study_id,
            from_user_id=from_user_id
        )
