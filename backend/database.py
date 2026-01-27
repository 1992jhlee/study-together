from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Date, ForeignKey, Enum, UniqueConstraint, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://study_user:study_password@localhost:5432/study_together")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class StatusEnum(str, enum.Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    CLOSED = "Closed"

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    username = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Password reset fields
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)

    # Relationships
    created_studies = relationship("Study", back_populates="creator", foreign_keys="Study.creator_id")
    study_memberships = relationship("StudyMember", back_populates="user")
    posts = relationship("Post", back_populates="user")
    comments = relationship("Comment", back_populates="user")
    issues = relationship("Issue", back_populates="user")
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id")

class Study(Base):
    __tablename__ = "studies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    creator_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="created_studies", foreign_keys=[creator_id])
    members = relationship("StudyMember", back_populates="study")
    posts = relationship("Post", back_populates="study")
    issues = relationship("Issue", back_populates="study")

class StudyMember(Base):
    __tablename__ = "study_members"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member")
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (UniqueConstraint('study_id', 'user_id', name='_study_user_uc'),)
    
    # Relationships
    study = relationship("Study", back_populates="members")
    user = relationship("User", back_populates="study_memberships")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    study = relationship("Study", back_populates="posts")
    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    post = relationship("Post", back_populates="comments")
    issue = relationship("Issue", back_populates="comments")
    user = relationship("User", back_populates="comments")

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="Scheduled")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    study = relationship("Study", back_populates="issues")
    user = relationship("User", back_populates="issues")
    comments = relationship("Comment", back_populates="issue")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    notification_type = Column(String(50), nullable=False)  # post_comment, issue_comment, new_post, new_issue
    message = Column(Text, nullable=False)

    # Related entity IDs (optional)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    issue_id = Column(Integer, ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    study_id = Column(Integer, ForeignKey("studies.id", ondelete="SET NULL"), nullable=True)
    from_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications", foreign_keys=[user_id])
    from_user = relationship("User", foreign_keys=[from_user_id])
    post = relationship("Post")
    issue = relationship("Issue")
    study = relationship("Study")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
