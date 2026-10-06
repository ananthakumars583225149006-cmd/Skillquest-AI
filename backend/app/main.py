"""
FastAPI Microservice Entrypoint for Skill Quest AI
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .db.database import init_db
from .db.seed_curriculum import seed_database
from .routes.user import router as user_router
from .routes.mascot import router as mascot_router
from .routes.play import router as play_router
from .routes.ai import router as ai_router
from .routes.leagues import router as leagues_router

app = FastAPI(
    title="Skill Quest AI Service Engine",
    description="Backend microservice handling SPICE verification, BKT skill modeling, Socratic AI, and progression.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()
    await seed_database()


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Skill Quest AI Backend Microservice",
        "gemini_pro_model": os.getenv("GEMINI_PRO_MODEL", "gemini-1.5-pro"),
        "gemini_flash_model": os.getenv("GEMINI_FLASH_MODEL", "gemini-1.5-flash"),
        "spice_solver": "Deterministic Engine Ready",
    }


# Include Routers
app.include_router(user_router)
app.include_router(mascot_router)
app.include_router(play_router)
app.include_router(ai_router)
app.include_router(leagues_router)
