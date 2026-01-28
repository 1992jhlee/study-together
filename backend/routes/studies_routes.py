from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from database import get_db, Study, User, StudyMember, Post, Issue, Comment, Notification
from schemas import (
    StudyCreate, StudyUpdate, StudyResponse, StudyDetailResponse,
    StudyMemberCreate, StudyMemberResponse, StudyMemberWithUserResponse,
    PaginatedResponse
)
from auth import get_current_user

router = APIRouter(prefix="/studies", tags=["studies"])


# ==================== 스터디 목록 조회 ====================
@router.get("", response_model=dict)
async def get_studies(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    스터디 목록 조회
    
    - **skip**: 스킵할 항목 수
    - **limit**: 반환할 최대 항목 수
    """
    total = db.query(Study).count()
    studies = db.query(Study).offset(skip).limit(limit).all()
    
    items = []
    for study in studies:
        member_count = db.query(StudyMember).filter(StudyMember.study_id == study.id).count()
        items.append({
            **StudyResponse.from_orm(study).dict(),
            "member_count": member_count
        })
    
    return {"total": total, "items": items}


# ==================== 스터디 상세 조회 ====================
@router.get("/{study_id}", response_model=dict)
async def get_study(study_id: int, db: Session = Depends(get_db)):
    """
    스터디 상세 조회
    
    - **study_id**: 스터디 ID
    """
    study = db.query(Study).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    # 멤버 정보 조회
    members = db.query(StudyMember).filter(StudyMember.study_id == study_id).all()
    members_data = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        members_data.append({
            "id": user.id,
            "username": user.username,
            "role": member.role,
            "joined_at": member.joined_at.isoformat()
        })
    
    return {
        **StudyResponse.from_orm(study).dict(),
        "creator": {"id": study.creator.id, "username": study.creator.username},
        "members": members_data
    }


# ==================== 스터디 생성 ====================
@router.post("", response_model=StudyResponse, status_code=status.HTTP_201_CREATED)
async def create_study(
    study: StudyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디 생성
    
    - **name**: 스터디 이름
    - **description**: 스터디 설명 (선택사항)
    """
    # 스터디 이름 중복 체크
    existing = db.query(Study).filter(Study.name == study.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 같은 이름의 스터디가 존재합니다"
        )

    db_study = Study(
        name=study.name,
        description=study.description,
        creator_id=current_user.id
    )

    db.add(db_study)
    db.commit()
    db.refresh(db_study)
    
    # 생성자를 자동으로 멤버에 추가 (admin)
    creator_member = StudyMember(
        study_id=db_study.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(creator_member)
    db.commit()
    
    return db_study


# ==================== 스터디 수정 ====================
@router.put("/{study_id}", response_model=StudyResponse)
async def update_study(
    study_id: int,
    study_update: StudyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디 수정 (생성자만 가능)
    
    - **study_id**: 스터디 ID
    - **name**: 새로운 스터디 이름 (선택사항)
    - **description**: 새로운 설명 (선택사항)
    """
    db_study = db.query(Study).filter(Study.id == study_id).first()
    
    if not db_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    if db_study.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this study"
        )
    
    if study_update.name is not None:
        db_study.name = study_update.name
    if study_update.description is not None:
        db_study.description = study_update.description
    
    db.commit()
    db.refresh(db_study)
    
    return db_study


# ==================== 스터디 삭제 ====================
@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study(
    study_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디 삭제 (생성자만 가능)
    
    - **study_id**: 스터디 ID
    """
    db_study = db.query(Study).filter(Study.id == study_id).first()
    
    if not db_study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    if db_study.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this study"
        )

    # 관련 알림 삭제
    db.query(Notification).filter(Notification.study_id == study_id).delete()
    # 게시물/이슈의 댓글 삭제
    post_ids = [p.id for p in db.query(Post).filter(Post.study_id == study_id).all()]
    issue_ids = [i.id for i in db.query(Issue).filter(Issue.study_id == study_id).all()]
    if post_ids:
        db.query(Notification).filter(Notification.post_id.in_(post_ids)).delete(synchronize_session=False)
        db.query(Comment).filter(Comment.post_id.in_(post_ids)).delete(synchronize_session=False)
    if issue_ids:
        db.query(Notification).filter(Notification.issue_id.in_(issue_ids)).delete(synchronize_session=False)
        db.query(Comment).filter(Comment.issue_id.in_(issue_ids)).delete(synchronize_session=False)
    # 게시물, 이슈, 멤버 삭제
    db.query(Post).filter(Post.study_id == study_id).delete()
    db.query(Issue).filter(Issue.study_id == study_id).delete()
    db.query(StudyMember).filter(StudyMember.study_id == study_id).delete()
    # 스터디 삭제
    db.delete(db_study)
    db.commit()


# ==================== 스터디 멤버 추가 ====================
@router.post("/{study_id}/members", response_model=StudyMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_study_member(
    study_id: int,
    member: StudyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디 멤버 추가

    - **study_id**: 스터디 ID
    - **email**: 추가할 사용자 이메일
    """
    study = db.query(Study).filter(Study.id == study_id).first()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )

    # 이메일로 사용자 조회
    user_to_add = db.query(User).filter(User.email == member.email).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found with this email"
        )

    # 이미 멤버인지 확인
    existing_member = db.query(StudyMember).filter(
        and_(StudyMember.study_id == study_id, StudyMember.user_id == user_to_add.id)
    ).first()

    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this study"
        )

    db_member = StudyMember(
        study_id=study_id,
        user_id=user_to_add.id,
        role="member"
    )

    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    return db_member


# ==================== 스터디 멤버 조회 ====================
@router.get("/{study_id}/members", response_model=dict)
async def get_study_members(
    study_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    스터디 멤버 조회
    
    - **study_id**: 스터디 ID
    """
    study = db.query(Study).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    total = db.query(StudyMember).filter(StudyMember.study_id == study_id).count()
    members = db.query(StudyMember).filter(
        StudyMember.study_id == study_id
    ).offset(skip).limit(limit).all()
    
    items = []
    for member in members:
        user = db.query(User).filter(User.id == member.user_id).first()
        items.append({
            "id": member.id,
            "user_id": member.user_id,
            "username": user.username,
            "role": member.role,
            "joined_at": member.joined_at.isoformat()
        })

    return {"total": total, "items": items}


# ==================== 스터디 멤버 삭제 ====================
@router.delete("/{study_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_study_member(
    study_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    스터디 멤버 삭제 (생성자만 가능, 자기 자신은 삭제 불가)

    - **study_id**: 스터디 ID
    - **user_id**: 삭제할 멤버의 사용자 ID
    """
    study = db.query(Study).filter(Study.id == study_id).first()

    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )

    # 생성자만 멤버 삭제 가능
    if study.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the study creator can remove members"
        )

    # 자기 자신(생성자)은 삭제 불가
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from the study"
        )

    # 멤버 조회
    member = db.query(StudyMember).filter(
        and_(StudyMember.study_id == study_id, StudyMember.user_id == user_id)
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this study"
        )

    db.delete(member)
    db.commit()
