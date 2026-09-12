"""Create or reset the deployment-managed MedVision AI administrator."""

from app.core.config import settings
from app.core.security import hash_password
from app.database.connection import SessionLocal
from app.database.models import User


def seed_admin() -> None:
    if not settings.ADMIN_PASSWORD:
        raise RuntimeError(
            "Set ADMIN_PASSWORD in backend/.env before running the admin seed."
        )

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if admin is None:
            admin = User(
                full_name="MedVision AI Administrator",
                email=settings.ADMIN_EMAIL,
                password=hash_password(settings.ADMIN_PASSWORD),
                role="ADMIN",
            )
            db.add(admin)
        else:
            admin.role = "ADMIN"
            admin.password = hash_password(settings.ADMIN_PASSWORD)

        db.commit()
        print(f"Admin account ready: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
