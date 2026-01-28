from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from database import SessionLocal, User, get_db
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    ForgotPasswordRequest, ForgotPasswordResponse,
    ResetPasswordRequest, ResetPasswordResponse,
    UserUpdateRequest
)
from auth import (
    hash_password,
    verify_password,
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from email_utils import send_password_reset_email, SMTP_CONFIGURED

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    사용자 회원가입
    
    - **email**: 사용자 이메일 (고유)
    - **username**: 사용자명 (3-100자)
    - **password**: 비밀번호 (최소 8자)
    """
    # 이메일 중복 체크
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # 새 사용자 생성
    hashed_password = hash_password(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        password=hashed_password,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    사용자 로그인
    
    - **email**: 사용자 이메일
    - **password**: 사용자 비밀번호
    
    성공 시 JWT 토큰 반환
    """
    # 사용자 인증
    db_user = authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email},
        expires_delta=access_token_expires,
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user,
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    사용자 로그아웃
    
    클라이언트에서 토큰을 삭제하면 됩니다.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    현재 로그인한 사용자 정보 조회
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회원 정보 수정

    - **username**: 새로운 사용자명 (선택)
    - **current_password**: 현재 비밀번호 (비밀번호 변경 시 필수)
    - **new_password**: 새로운 비밀번호 (선택)
    """
    user = db.query(User).filter(User.id == current_user.id).first()

    if request.username is not None:
        user.username = request.username

    if request.new_password:
        if not request.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호를 입력해주세요"
            )
        if not verify_password(request.current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 일치하지 않습니다"
            )
        user.password = hash_password(request.new_password)

    db.commit()
    db.refresh(user)
    return user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    비밀번호 재설정 이메일 전송

    - **email**: 사용자 이메일

    등록된 이메일이면 재설정 링크를 전송합니다.
    보안을 위해 이메일 존재 여부와 관계없이 동일한 응답을 반환합니다.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        # 토큰 생성 (URL-safe)
        reset_token = secrets.token_urlsafe(32)

        # 만료 시간 설정 (1시간)
        expires = datetime.utcnow() + timedelta(hours=1)

        # DB에 저장
        user.password_reset_token = reset_token
        user.password_reset_expires = expires
        db.commit()

        # 이메일 전송 (비동기)
        try:
            await send_password_reset_email(request.email, reset_token)
        except Exception as e:
            # 이메일 전송 실패 시 로그 기록 (사용자에게는 동일 응답)
            print(f"Email sending failed: {e}")

        # SMTP 미설정 시 개발용으로 리셋 링크 응답에 포함
        if not SMTP_CONFIGURED:
            import os
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            reset_link = f"{frontend_url}/reset-password?token={reset_token}"
            return {
                "message": "SMTP가 설정되지 않아 이메일을 전송할 수 없습니다. 아래 링크를 사용해주세요.",
                "reset_link": reset_link
            }

    # 보안: 이메일 존재 여부와 관계없이 동일한 응답
    return {"message": "이메일이 등록되어 있다면 비밀번호 재설정 링크가 전송됩니다."}


@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    비밀번호 재설정

    - **token**: 이메일로 받은 재설정 토큰
    - **new_password**: 새 비밀번호 (최소 8자)
    """
    # 토큰으로 사용자 찾기
    user = db.query(User).filter(
        User.password_reset_token == request.token
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않거나 만료된 토큰입니다."
        )

    # 토큰 만료 확인
    if user.password_reset_expires < datetime.utcnow():
        # 만료된 토큰 삭제
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="토큰이 만료되었습니다. 다시 요청해주세요."
        )

    # 새 비밀번호 설정
    user.password = hash_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}
