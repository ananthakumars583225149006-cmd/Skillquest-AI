"""
SQLAlchemy ORM models mirroring the Supabase PostgreSQL database schema.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


def get_utc_now():
        return datetime.now(timezone.utc).replace(tzinfo=None)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    active_track = Column(String(10), default="EEE")  # CSE, ECE, EEE
    xp = Column(Integer, default=0)
    spark_coins = Column(Integer, default=100)
    streak_days = Column(Integer, default=1)
    last_active_at = Column(DateTime, default=get_utc_now)
    hearts = Column(Integer, default=5)
    max_hearts = Column(Integer, default=5)
    equipped_outfit_id = Column(String(36), nullable=True)
    current_league = Column(String(50), default="Bronze")
    created_at = Column(DateTime, default=get_utc_now)

    # Relationships
    inventory = relationship("UserMascotInventory", back_populates="user", cascade="all, delete-orphan")
    progress = relationship("UserCourseProgress", back_populates="user", cascade="all, delete-orphan")
    bkt_masteries = relationship("BKTTopicMastery", back_populates="user", cascade="all, delete-orphan")


class MascotOutfit(Base):
    __tablename__ = "mascot_outfits"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(30), nullable=False)  # TRACK, CULTURAL, ACHIEVEMENT, BOSS
    image_layer_url = Column(Text, nullable=False)
    price_coins = Column(Integer, default=0)
    unlock_required_badge = Column(String(100), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)


class UserMascotInventory(Base):
    __tablename__ = "user_mascot_inventory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    outfit_id = Column(String(36), ForeignKey("mascot_outfits.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime, default=get_utc_now)

    user = relationship("Profile", back_populates="inventory")
    outfit = relationship("MascotOutfit")


class Level(Base):
    __tablename__ = "levels"

    id = Column(String(50), primary_key=True)  # e.g., "eee-lvl-1"
    track = Column(String(10), nullable=False)  # CSE, ECE, EEE
    module_index = Column(Integer, nullable=False)  # 1, 2, 3
    level_number = Column(Integer, nullable=False)  # 1 to 30
    title = Column(String(200), nullable=False)
    topic_tag = Column(String(100), nullable=False)
    learning_objective = Column(Text, nullable=False)
    prerequisite = Column(String(200), nullable=False)
    short_lesson_markdown = Column(Text, nullable=False)
    is_boss_level = Column(Boolean, default=False)
    boss_scenario_brief = Column(Text, nullable=True)
    xp_reward = Column(Integer, default=100)
    coin_reward = Column(Integer, default=15)
    created_at = Column(DateTime, default=get_utc_now)

    challenges = relationship("Challenge", back_populates="level", cascade="all, delete-orphan", order_by="Challenge.order_index")
    notes = relationship("LevelNote", back_populates="level", uselist=False, cascade="all, delete-orphan")


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    level_id = Column(String(50), ForeignKey("levels.id", ondelete="CASCADE"), nullable=False)
    order_index = Column(Integer, nullable=False)
    challenge_type = Column(String(50), nullable=False)  # SPICE_CIRCUIT, CODE_DEBUG, TRUTH_TABLE, SLIDER_TUNING, PHASOR_ALIGN
    prompt_text = Column(Text, nullable=False)
    initial_state_json = Column(JSON, nullable=False)
    target_state_json = Column(JSON, nullable=False)
    hints_json = Column(JSON, nullable=False)
    difficulty_rating = Column(Float, default=0.5)
    created_at = Column(DateTime, default=get_utc_now)

    level = relationship("Level", back_populates="challenges")


class LevelNote(Base):
    __tablename__ = "level_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    level_id = Column(String(50), ForeignKey("levels.id", ondelete="CASCADE"), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    key_points = Column(JSON, default=list, nullable=False)
    formulas_rules = Column(JSON, default=list, nullable=False)
    worked_example = Column(JSON, default=dict, nullable=False)
    visual_asset_url = Column(Text, nullable=True)
    real_world_connection = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    level = relationship("Level", back_populates="notes")


class KnowledgeQuest(Base):
    __tablename__ = "knowledge_quests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    track = Column(String(10), nullable=False)  # CSE, ECE, EEE
    module_index = Column(Integer, nullable=False)  # 1, 2, 3
    title = Column(String(200), nullable=False)
    recap_summary = Column(Text, nullable=False)
    concept_breakdown = Column(JSON, default=list, nullable=False)
    key_formulas = Column(JSON, default=list, nullable=False)
    practice_flashcards = Column(JSON, default=list, nullable=False)
    unlocked_after_level_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)


class UserCourseProgress(Base):
    __tablename__ = "user_course_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    track = Column(String(10), nullable=False)
    completed_level_ids = Column(JSON, default=list)  # list of level_ids
    stars_earned_json = Column(JSON, default=dict)  # {"eee-lvl-1": 3}
    unlocked_level_number = Column(Integer, default=1)
    read_notes_level_ids = Column(JSON, default=list, nullable=False)
    completed_knowledge_quest_ids = Column(JSON, default=list, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now)

    user = relationship("Profile", back_populates="progress")


class BKTTopicMastery(Base):
    __tablename__ = "bkt_topic_mastery"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    track = Column(String(10), nullable=False)
    topic_tag = Column(String(100), nullable=False)
    p_mastery = Column(Float, default=0.30)
    last_decay_timestamp = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now)

    user = relationship("Profile", back_populates="bkt_masteries")


class LeagueStanding(Base):
    __tablename__ = "league_standings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    username = Column(String(100), nullable=False)
    league_tier = Column(String(50), default="Bronze")  # Bronze, Silver, Gold, Platinum, Diamond, Quantum
    weekly_xp = Column(Integer, default=0)
    division_id = Column(Integer, default=1)
    rank = Column(Integer, default=1)
    updated_at = Column(DateTime, default=get_utc_now)


class AdvancedMLTelemetry(Base):
    __tablename__ = "advanced_ml_telemetry_hooks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    raw_feature_vector = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)
