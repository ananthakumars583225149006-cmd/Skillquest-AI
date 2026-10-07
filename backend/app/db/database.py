"""
Database connection and session manager for Skill Quest AI.
Supports PostgreSQL (Supabase) via asyncpg, with seamless aiosqlite fallback for local operation.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./skillquest.db")

# Normalize postgresql:// to postgresql+asyncpg:// for SQLAlchemy async engine
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    """Dependency for providing database sessions to FastAPI routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initializes tables in database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe migration check for local SQLite when table already exists
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE user_course_progress ADD COLUMN read_notes_level_ids JSON DEFAULT '[]'"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE user_course_progress ADD COLUMN completed_knowledge_quest_ids JSON DEFAULT '[]'"))
        except Exception:
            pass
