from .auth_routes import router as auth_router
from .studies_routes import router as studies_router
from .posts_routes import router as posts_router
from .comments_routes import router as comments_router
from .issues_routes import router as issues_router
from .notifications_routes import router as notifications_router

__all__ = [
    "auth_router",
    "studies_router",
    "posts_router",
    "comments_router",
    "issues_router",
    "notifications_router"
]
