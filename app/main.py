from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import payments
from .database import engine, Base
from .config import settings
from .routers import farmers, katai, expenses, auth

# 🔥 IMPORTANT: App chalu hote hi SQLite database ki saari tables automatic banane ke liye
Base.metadata.create_all(bind=engine)

# FastAPI App Initialize kar rahe hain
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Harvester Business Owner Analytics aur Khata Management System Backend"
)

# 🌐 Frontend (React / Vite) se Connect karne ke liye CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Saare module ke routers ko main app mein register (include) karna
app.include_router(auth.router)
app.include_router(farmers.router)
app.include_router(katai.router)
app.include_router(expenses.router)
app.include_router(payments.router)

@app.get("/")
def home():
    """Root Route: Check karne ke liye ki backend sahi chal raha hai ya nahi"""
    return {
        "status": "Running",
        "app_name": settings.PROJECT_NAME,
        "message": "Harvester Backend ekdum makkhan chal raha hai bhai!"
    }