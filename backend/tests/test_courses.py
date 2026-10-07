"""
Integration Unit Tests for Courses Router:
- GET /api/v1/courses/levels/{level_id}/notes (seeded and unseeded fallback)
- POST /api/v1/courses/levels/{level_id}/notes/read
- GET /api/v1/courses/tracks/{track}/knowledge-quest/{module_index}
- POST /api/v1/courses/tracks/{track}/knowledge-quest/{module_index}/complete
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.database import init_db
from app.db.seed_curriculum import seed_database


@pytest.fixture(autouse=True)
async def ensure_db():
    await init_db()
    await seed_database()


@pytest.mark.asyncio
async def test_get_seeded_level_notes():
    """Test fetching seeded level notes returns 200 with KaTeX formulas and worked example."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/courses/levels/eee-lvl-1/notes")
        assert resp.status_code == 200
        data = resp.json()
        assert data["level_id"] == "eee-lvl-1"
        assert len(data["formulas_rules"]) > 0
        assert "worked_example" in data
        assert "real_world_connection" in data
        assert isinstance(data["key_points"], list)


@pytest.mark.asyncio
async def test_get_unseeded_level_notes_fallback():
    """
    Test missing notes handling: If called for unseeded/non-existent level,
    returns 200 OK fallback payload with auto-generated key takeaways.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/courses/levels/unseeded-level-999/notes")
        assert resp.status_code == 200
        data = resp.json()
        assert data["level_id"] == "unseeded-level-999"
        assert "Mission Primer" in data["title"]
        assert len(data["key_points"]) > 0
        assert len(data["formulas_rules"]) > 0


@pytest.mark.asyncio
async def test_mark_level_notes_read():
    """Test marking notes as read updates user progress."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post("/api/v1/courses/levels/eee-lvl-1/notes/read")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert "eee-lvl-1" in data["read_notes_level_ids"]

        # Verify get_level_notes reflects is_read = True
        get_resp = await client.get("/api/v1/courses/levels/eee-lvl-1/notes")
        assert get_resp.status_code == 200
        assert get_resp.json()["is_read"] is True


@pytest.mark.asyncio
async def test_get_knowledge_quest():
    """Test fetching 10-level summary & flashcard deck returns 200 with cards."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/courses/tracks/EEE/knowledge-quest/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["track"] == "EEE"
        assert data["module_index"] == 1
        assert len(data["practice_flashcards"]) >= 3
        assert len(data["key_formulas"]) > 0
        assert data["unlocked_after_level_number"] == 10


@pytest.mark.asyncio
async def test_complete_knowledge_quest_awards_rewards():
    """Test completing Knowledge Quest awards coins, XP, and unlocks Boss."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get profile before
        prof_before = (await client.get("/api/v1/user/profile")).json()
        coins_before = prof_before["spark_coins"]
        xp_before = prof_before["xp"]

        # Complete module 1 quest
        resp = await client.post("/api/v1/courses/tracks/EEE/knowledge-quest/1/complete")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["spark_coins_awarded"] == 50
        assert data["xp_awarded"] == 100
        assert data["boss_unlocked"] is True

        # Check profile after
        prof_after = (await client.get("/api/v1/user/profile")).json()
        assert prof_after["spark_coins"] >= coins_before + 50
        assert prof_after["xp"] >= xp_before + 100
