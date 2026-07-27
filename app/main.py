from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import payments
from .database import engine, Base
from .config import settings
from .routers import farmers, katai, expenses, auth

# 💡 IMPORTANT: Models import karna zaroori hai taaki Base ko saari tables ka pata chale
from . import models

# 🔥 Automatically create database tables in Supabase / SQLite
models.Base.metadata.create_all(bind=engine)

# FastAPI App Initialize
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Harvester Business Owner Analytics aur Khata Management System Backend"
)

# 🌐 Frontend CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(farmers.router)
app.include_router(katai.router)
app.include_router(expenses.router)
app.include_router(payments.router)

@app.get("/")
def home():
    """Root Route"""
    return {
        "status": "Running",
        "app_name": settings.PROJECT_NAME,
        "message": "Harvester Backend ekdum makkhan chal raha hai bhai!"
    }