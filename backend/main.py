import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, get_db
from routes import auth_router, studies_router, posts_router, comments_router, issues_router, notifications_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Study Together API",
    description="스터디 자료 공유 및 토론 플랫폼 API",
    version="0.1.0",
)

# CORS 설정
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우트 등록
app.include_router(auth_router, prefix="/api")
app.include_router(studies_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(comments_router, prefix="/api")
app.include_router(issues_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Study Together API Server"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/db-status")
def db_status():
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        db.close()
        return {"database": "connected"}
    except Exception as e:
        return {"database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
