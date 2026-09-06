from fastapi import FastAPI
from sqlalchemy import text

from app.database.connection import Base, engine
from app.database import models
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.diagnosis import router as diagnosis_router

app = FastAPI(
    title="MedVision AI",
    description="AI-Powered Medical Diagnosis Assistant",
    version="1.0.0"
)


Base.metadata.create_all(bind=engine)


app.include_router(auth_router)
app.include_router(diagnosis_router)
app.include_router(users_router)    

@app.get("/")
def root():
    return {
        "message": "MedVision AI Backend is running"
    }


@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }



