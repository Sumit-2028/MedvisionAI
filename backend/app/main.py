# ============================================================
# MedVision AI - FastAPI Application
# ============================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from app.database.connection import engine
from app.core.config import settings

from app.database import models

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.diagnosis import router as diagnosis_router
from app.routers.admin import router as admin_router


# ============================================================
# Create FastAPI Application
# ============================================================

app = FastAPI(
    title="MedVision AI",
    description="AI-Powered Medical Diagnosis Assistant",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================
# Allows the React frontend to communicate with FastAPI.
#
# Vite normally runs on:
#   http://localhost:5173
#
# Sometimes the browser may use:
#   http://127.0.0.1:5173
#
# Therefore, both origins are allowed.
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.cors_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================
# Authentication routes
# Example:
#   POST /auth/login
# ============================================================

app.include_router(auth_router)


# ============================================================
# Diagnosis Routes
# ============================================================
# Example:
#   POST /diagnosis/upload
#   GET  /diagnosis/history
# ============================================================

app.include_router(diagnosis_router)


# ============================================================
# User Routes
# ============================================================

app.include_router(users_router)
app.include_router(admin_router)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "MedVision AI Backend is running"
    }


# ============================================================
# HEALTH CHECK ENDPOINT
# ============================================================
# Checks whether the backend can successfully communicate
# with the PostgreSQL database.
# ============================================================

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
            "error": "Database connection failed"
        }
