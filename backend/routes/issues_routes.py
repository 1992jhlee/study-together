from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date

from database import get_db, Issue, User, Study, Comment, StudyMember
from schemas import IssueCreate, IssueUpdate, IssueResponse, IssueDetailResponse
from auth import get_current_user
from notification_utils import notify_study_members

router = APIRouter(prefix="/issues", tags=["issues"])


def calculate_status(start_date: date, end_date: date) -> str:
    """날짜를 기반으로 상태를 자동 계산"""
    today = date.today()

    if start_date is None and end_date is None:
        return "In Progress"  # 날짜 미설정시 진행중으로

    if start_date and today < start_date:
        return "Scheduled"  # 시작일 전 = 예정

    if end_date and today > end_date:
        return "Closed"  # 종료일 후 = 완료

    return "In Progress"  # 기간 내 = 진행중


# ==================== 이슈 목록 조회 (메인 보드) ====================
@router.get("/study/{study_id}", response_model=dict)
async def get_study_issues(
    study_id: int,
    status_filter: str = Query(None, pattern="^(Scheduled|In Progress|Closed)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디 이슈 목록 조회 (멤버만 가능)
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
            detail="스터디 멤버만 이슈를 조회할 수 있습니다"
        )

    # 모든 이슈를 가져와서 상태를 계산
    all_issues = db.query(Issue).filter(Issue.study_id == study_id).all()

    # 상태를 계산하고 필터링
    items = []
    for issue in all_issues:
        calculated_status = calculate_status(issue.start_date, issue.end_date)

        # 필터링
        if status_filter and calculated_status != status_filter:
            continue

        items.append({
            "id": issue.id,
            "study_id": issue.study_id,
            "title": issue.title,
            "status": calculated_status,
            "start_date": issue.start_date.isoformat() if issue.start_date else None,
            "end_date": issue.end_date.isoformat() if issue.end_date else None,
            "author": {
                "id": issue.user.id,
                "username": issue.user.username
            },
            "created_at": issue.created_at.isoformat()
        })

    # 페이지네이션 적용
    total = len(items)
    items = items[skip:skip + limit]

    return {"total": total, "items": items}


# ==================== 이슈 상세 조회 ====================
@router.get("/{issue_id}", response_model=dict)
async def get_issue(issue_id: int, db: Session = Depends(get_db)):
    """
    이슈 상세 조회

    - **issue_id**: 이슈 ID
    """
    issue = db.query(Issue).filter(Issue.id == issue_id).first()

    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    # Get comments for this issue
    comments = db.query(Comment).filter(Comment.issue_id == issue_id).all()
    comments_data = []
    for comment in comments:
        comments_data.append({
            "id": comment.id,
            "issue_id": comment.issue_id,
            "user_id": comment.user_id,
            "content": comment.content,
            "created_at": comment.created_at.isoformat(),
            "updated_at": comment.updated_at.isoformat(),
            "author": {
                "id": comment.user.id,
                "username": comment.user.username,
                "email": comment.user.email
            }
        })

    # 상태 자동 계산
    calculated_status = calculate_status(issue.start_date, issue.end_date)

    return {
        "id": issue.id,
        "study_id": issue.study_id,
        "title": issue.title,
        "description": issue.description,
        "status": calculated_status,
        "start_date": issue.start_date.isoformat() if issue.start_date else None,
        "end_date": issue.end_date.isoformat() if issue.end_date else None,
        "author": {
            "id": issue.user.id,
            "username": issue.user.username
        },
        "created_at": issue.created_at.isoformat(),
        "updated_at": issue.updated_at.isoformat(),
        "comments": comments_data,
        "comment_count": len(comments_data)
    }


# ==================== 이슈 생성 ====================
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_issue(
    study_id: int,
    issue: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    이슈 생성

    - **study_id**: 스터디 ID (쿼리 파라미터)
    - **title**: 이슈 제목
    - **description**: 이슈 설명 (선택사항)
    - **start_date**: 시작일 (선택사항)
    - **end_date**: 종료일 (선택사항)
    """
    study = db.query(Study).filter(Study.id == study_id).first()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )

    # 날짜 기반으로 초기 상태 계산
    initial_status = calculate_status(issue.start_date, issue.end_date)

    db_issue = Issue(
        study_id=study_id,
        user_id=current_user.id,
        title=issue.title,
        description=issue.description,
        start_date=issue.start_date,
        end_date=issue.end_date,
        status=initial_status
    )

    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)

    # 스터디 멤버들에게 알림
    notify_study_members(
        db=db,
        study_id=study_id,
        notification_type="new_issue",
        message=f"{current_user.username}님이 새 이슈 '{issue.title}'을 생성했습니다.",
        exclude_user_id=current_user.id,
        issue_id=db_issue.id,
        from_user_id=current_user.id
    )
    db.commit()

    return {
        "id": db_issue.id,
        "study_id": db_issue.study_id,
        "user_id": db_issue.user_id,
        "title": db_issue.title,
        "description": db_issue.description,
        "status": initial_status,
        "start_date": db_issue.start_date.isoformat() if db_issue.start_date else None,
        "end_date": db_issue.end_date.isoformat() if db_issue.end_date else None,
        "created_at": db_issue.created_at.isoformat(),
        "updated_at": db_issue.updated_at.isoformat()
    }


# ==================== 이슈 수정 ====================
@router.put("/{issue_id}", response_model=dict)
async def update_issue(
    issue_id: int,
    issue_update: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    이슈 정보 수정

    - **issue_id**: 이슈 ID
    - **title**: 새로운 제목 (선택사항)
    - **description**: 새로운 설명 (선택사항)
    - **start_date**: 시작일 (선택사항)
    - **end_date**: 종료일 (선택사항)
    """
    db_issue = db.query(Issue).filter(Issue.id == issue_id).first()

    if not db_issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )

    if db_issue.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this issue"
        )

    if issue_update.title is not None:
        db_issue.title = issue_update.title
    if issue_update.description is not None:
        db_issue.description = issue_update.description
    if issue_update.start_date is not None:
        db_issue.start_date = issue_update.start_date
    if issue_update.end_date is not None:
        db_issue.end_date = issue_update.end_date

    # 날짜 기반으로 상태 재계산
    db_issue.status = calculate_status(db_issue.start_date, db_issue.end_date)

    db.commit()
    db.refresh(db_issue)

    return {
        "id": db_issue.id,
        "title": db_issue.title,
        "description": db_issue.description,
        "status": db_issue.status,
        "start_date": db_issue.start_date.isoformat() if db_issue.start_date else None,
        "end_date": db_issue.end_date.isoformat() if db_issue.end_date else None,
        "updated_at": db_issue.updated_at.isoformat()
    }


# ==================== 이슈 삭제 ====================
@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    issue_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    이슈 삭제 (생성자만 가능)
    
    - **issue_id**: 이슈 ID
    """
    db_issue = db.query(Issue).filter(Issue.id == issue_id).first()
    
    if not db_issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Issue not found"
        )
    
    if db_issue.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this issue"
        )
    
    db.delete(db_issue)
    db.commit()
