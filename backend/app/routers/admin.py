from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.database.connection import get_db
from app.database.models import User


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/me")
def get_admin_profile(
    current_admin: User = Depends(get_current_admin),
):
    return {
        "user_id": current_admin.user_id,
        "full_name": current_admin.full_name,
        "email": current_admin.email,
        "role": current_admin.role,
    }


@router.get("/dashboard")
def get_admin_dashboard(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()

    total_physicians = (
        db.query(User)
        .filter(User.role == "PHYSICIAN")
        .count()
    )

    total_admins = (
        db.query(User)
        .filter(User.role == "ADMIN")
        .count()
    )

    return {
        "message": "Admin dashboard access granted",
        "admin": {
            "user_id": current_admin.user_id,
            "full_name": current_admin.full_name,
            "email": current_admin.email,
        },
        "statistics": {
            "total_users": total_users,
            "total_physicians": total_physicians,
            "total_admins": total_admins,
        },
    }