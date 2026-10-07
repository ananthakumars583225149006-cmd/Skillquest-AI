"""
Curriculum, Interactive Level Notes, and Knowledge Quest Revision Routes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uuid

from ..db.database import get_db
from ..db.models import Level, LevelNote, KnowledgeQuest, UserCourseProgress, Profile

router = APIRouter(prefix="/api/v1/courses", tags=["Curriculum & Notes"])


# Pydantic Schemas with safe default factories
class FormulaRuleItem(BaseModel):
    label: str = "Key Law"
    latex: str = "V = I \\times R"


class WorkedExampleData(BaseModel):
    problem: str = ""
    step_by_step: str = ""
    solution: str = ""


class FlashcardItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    front: str = ""
    back: str = ""
    category: str = "Core Concept"


class LevelNoteResponse(BaseModel):
    id: str
    level_id: str
    title: str
    summary: str
    key_points: List[str] = Field(default_factory=list)
    formulas_rules: List[Dict[str, Any]] = Field(default_factory=list)
    worked_example: Dict[str, Any] = Field(default_factory=dict)
    visual_asset_url: Optional[str] = None
    real_world_connection: str = ""
    is_read: bool = False


class KnowledgeQuestResponse(BaseModel):
    id: str
    track: str
    module_index: int
    title: str
    recap_summary: str
    concept_breakdown: List[Any] = Field(default_factory=list)
    key_formulas: List[Dict[str, Any]] = Field(default_factory=list)
    practice_flashcards: List[Dict[str, Any]] = Field(default_factory=list)
    unlocked_after_level_number: int
    is_completed: bool = False


# Helper: Generate safe 200 OK fallback Level Note
def generate_fallback_level_note(level_id: str, level: Optional[Level] = None) -> Dict[str, Any]:
    title = level.title if level else f"Level {level_id.split('-')[-1]} Engineering Primer"
    objective = level.learning_objective if level else "Understand governing electrical and computational relationships."
    track = level.track if level else "EEE"

    if track == "EEE":
        formulas = [
            {"label": "Ohm's Law", "latex": "V = I \\times R"},
            {"label": "Joule Heating Power", "latex": "P = V \\times I = I^2 \\times R"},
            {"label": "Voltage Divider Ratio", "latex": "V_{out} = V_{in} \\times \\frac{R_2}{R_1 + R_2}"},
        ]
        real_world = "Used in smartphone power delivery ICs, DC-DC buck converters, and battery cell charge balancers."
    elif track == "CSE":
        formulas = [
            {"label": "Bitwise Shift Multiplication", "latex": "x \\ll k = x \\times 2^k"},
            {"label": "Time Complexity Bound", "latex": "T(n) = \\mathcal{O}(n \\log n)"},
            {"label": "Boolean Inversion", "latex": "\\overline{A \\cdot B} = \\overline{A} + \\overline{B}"},
        ]
        real_world = "Underpins memory page translation in Linux kernels, high-speed routing engines, and cryptography hashing."
    else:  # ECE
        formulas = [
            {"label": "Resonant Frequency", "latex": "f_0 = \\frac{1}{2\\pi\\sqrt{LC}}"},
            {"label": "Inverting Op-Amp Gain", "latex": "A_v = -\\frac{R_f}{R_{in}}"},
            {"label": "Nyquist Shannon Limit", "latex": "f_s \\ge 2 \\cdot f_{max}"},
        ]
        real_world = "Crucial for 5G RF front-end bandpass filters, automotive radar transceivers, and medical ECG monitors."

    return {
        "id": f"note-fallback-{level_id}",
        "level_id": level_id,
        "title": f"Mission Primer: {title}",
        "summary": f"Welcome to this foundational engineering checkpoint! In this module, you'll master: {objective}",
        "key_points": [
            f"Establish theoretical equilibrium for {title}.",
            "Analyze deterministic state variables before adjusting simulation components.",
            "Verify steady-state stability against target tolerance bands.",
        ],
        "formulas_rules": formulas,
        "worked_example": {
            "problem": f"Given test criteria in {title}, calculate the expected steady-state response.",
            "step_by_step": "1. Identify circuit or algorithm inputs and boundary constraints.\n2. Apply governing Kirchhoff or algorithmic invariants.\n3. Compute target values and compare with SPICE/telemetry sensors.",
            "solution": "Equilibrium state established within ±1.5% margin.",
        },
        "visual_asset_url": None,
        "real_world_connection": real_world,
    }


# Helper: Generate safe 200 OK fallback Knowledge Quest
def generate_fallback_knowledge_quest(track: str, module_index: int) -> Dict[str, Any]:
    track_code = track.upper()
    unlocked_lvl = module_index * 10

    if track_code == "EEE":
        title = f"EEE Module {module_index}: Power & Circuit Synthesis Revision"
        summary = f"Synthesizing 10 levels of DC network analysis, Kirchhoff laws, Thevenin equivalents, and operational amplifiers before the Module {module_index} Boss!"
        flashcards = [
            {
                "id": "fc-1",
                "front": "What does Ohm's Law state?",
                "back": "V = I * R: Voltage drop is proportional to current flowing through resistance.",
                "category": "Core Law",
            },
            {
                "id": "fc-2",
                "front": "State Kirchhoff's Current Law (KCL)",
                "back": "The algebraic sum of currents entering any node equals zero (Conservation of Charge).",
                "category": "Network Law",
            },
            {
                "id": "fc-3",
                "front": "What is the Voltage Divider Equation?",
                "back": "V_out = V_in * (R2 / (R1 + R2)) for series resistors.",
                "category": "Analysis",
            },
            {
                "id": "fc-4",
                "front": "How do you calculate series vs parallel equivalent resistance?",
                "back": "Series: R_eq = R1 + R2. Parallel: 1/R_eq = 1/R1 + 1/R2.",
                "category": "Equivalents",
            },
            {
                "id": "fc-5",
                "front": "What is the ideal Op-Amp golden rule in negative feedback?",
                "back": "1. Zero input current (I+ = I- = 0). 2. Virtual short between inputs (V+ = V-).",
                "category": "Op-Amps",
            },
        ]
        formulas = [
            {"label": "Ohm's Law", "latex": "V = I \\times R"},
            {"label": "Voltage Divider", "latex": "V_{out} = V_{in} \\cdot \\frac{R_2}{R_1 + R_2}"},
            {"label": "Kirchhoff Current Law", "latex": "\\sum I_{in} = \\sum I_{out}"},
            {"label": "Inverting Gain", "latex": "A_v = -\\frac{R_f}{R_{in}}"},
        ]
    elif track_code == "CSE":
        title = f"CSE Module {module_index}: Algorithmic Systems & Data Synthesis"
        summary = f"Synthesizing 10 levels of bitwise math, memory pointers, algorithmic complexity, and cache locality before the Module {module_index} Boss!"
        flashcards = [
            {
                "id": "fc-1",
                "front": "What is the result of x << 3?",
                "back": "Multiplies x by 2^3 = 8 via binary left shift.",
                "category": "Bitwise",
            },
            {
                "id": "fc-2",
                "front": "What is Big-O complexity of Binary Search?",
                "back": "O(log n) because the search space halves on every comparison step.",
                "category": "Complexity",
            },
            {
                "id": "fc-3",
                "front": "What is Stack vs Heap memory in C/C++?",
                "back": "Stack: Automatic LIFO allocation for local variables. Heap: Dynamic programmer-managed memory.",
                "category": "Systems",
            },
            {
                "id": "fc-4",
                "front": "What does De Morgan's Law state?",
                "back": "!(A && B) == !A || !B and !(A || B) == !A && !B.",
                "category": "Boolean Logic",
            },
            {
                "id": "fc-5",
                "front": "What is a Hash Collision?",
                "back": "When two distinct keys produce the same bucket index via hash function.",
                "category": "Data Structures",
            },
        ]
        formulas = [
            {"label": "Bitwise Left Shift", "latex": "x \\ll k = x \\cdot 2^k"},
            {"label": "Logarithmic Search", "latex": "T(n) = \\mathcal{O}(\\log n)"},
            {"label": "De Morgan's Theorem", "latex": "\\overline{A \\cdot B} = \\overline{A} + \\overline{B}"},
        ]
    else:  # ECE
        title = f"ECE Module {module_index}: Signals, Semiconductor & RF Synthesis"
        summary = f"Synthesizing 10 levels of diode junctions, transistor bias, Fourier harmonics, and resonant filter design before the Module {module_index} Boss!"
        flashcards = [
            {
                "id": "fc-1",
                "front": "What is the formula for RLC series resonance frequency?",
                "back": "f0 = 1 / (2 * pi * sqrt(L * C)). Inductive and capacitive reactances cancel out.",
                "category": "Resonance",
            },
            {
                "id": "fc-2",
                "front": "What is the Nyquist Sampling Theorem?",
                "back": "Sampling frequency fs must be at least twice the maximum signal frequency component (fs >= 2*fmax).",
                "category": "Signals",
            },
            {
                "id": "fc-3",
                "front": "What is the forward voltage drop of a standard silicon diode?",
                "back": "Approximately 0.7 Volts (0.2V - 0.3V for Germanium or Schottky).",
                "category": "Semiconductors",
            },
            {
                "id": "fc-4",
                "front": "What is the 3dB cutoff frequency of a first-order RC filter?",
                "back": "f_c = 1 / (2 * pi * R * C). At this frequency, power drops by half (-3 dB).",
                "category": "Filters",
            },
            {
                "id": "fc-5",
                "front": "What is Transconductance (gm) in a MOSFET?",
                "back": "gm = dI_D / dV_GS: the ratio of output drain current change to input gate-to-source voltage change.",
                "category": "Transistors",
            },
        ]
        formulas = [
            {"label": "Resonance Frequency", "latex": "f_0 = \\frac{1}{2\\pi\\sqrt{LC}}"},
            {"label": "RC Cutoff Frequency", "latex": "f_c = \\frac{1}{2\\pi R C}"},
            {"label": "Nyquist Shannon Rate", "latex": "f_s \\ge 2 \\cdot f_{max}"},
        ]

    return {
        "id": f"kq-fallback-{track_code.lower()}-{module_index}",
        "track": track_code,
        "module_index": module_index,
        "title": title,
        "recap_summary": summary,
        "concept_breakdown": [
            f"Review governing principles across Levels {(module_index - 1) * 10 + 1} to {unlocked_lvl}.",
            "Solidify formula transformations and unit consistency.",
            "Complete the interactive 3D flip-cards to lock in memory retention.",
            "Engage Spike's Boss Revision briefing before tackling the emergency scenario.",
        ],
        "key_formulas": formulas,
        "practice_flashcards": flashcards,
        "unlocked_after_level_number": unlocked_lvl,
    }


# ==============================================================================
# 1. LEVEL NOTES ENDPOINTS
# ==============================================================================

@router.get("/levels/{level_id}/notes", response_model=LevelNoteResponse)
async def get_level_notes(
    level_id: str,
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches interactive game-like Level Notes for the given level.
    Guarantees 200 OK fallback if notes are not explicitly seeded.
    """
    # 1. Check if explicit note exists in DB
    note_res = await db.execute(select(LevelNote).where(LevelNote.level_id == level_id))
    note = note_res.scalars().first()

    # 2. Check user progress to determine if already read
    lvl_res = await db.execute(select(Level).where(Level.id == level_id))
    level = lvl_res.scalars().first()
    track_code = level.track if level else (level_id.split("-")[0].upper() if "-" in level_id else "EEE")

    prog_res = await db.execute(
        select(UserCourseProgress).where(
            UserCourseProgress.user_id == user_id,
            UserCourseProgress.track == track_code
        )
    )
    prog = prog_res.scalars().first()
    read_notes_ids = set(prog.read_notes_level_ids) if (prog and prog.read_notes_level_ids) else set()
    is_read = level_id in read_notes_ids

    if note:
        return LevelNoteResponse(
            id=note.id,
            level_id=note.level_id,
            title=note.title,
            summary=note.summary,
            key_points=note.key_points or [],
            formulas_rules=note.formulas_rules or [],
            worked_example=note.worked_example or {},
            visual_asset_url=note.visual_asset_url,
            real_world_connection=note.real_world_connection,
            is_read=is_read,
        )

    # 3. Fallback: Generate 200 OK auto-generated notes payload safely
    fallback_data = generate_fallback_level_note(level_id, level)
    fallback_data["is_read"] = is_read
    return LevelNoteResponse(**fallback_data)


class ReadNoteRequest(BaseModel):
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001"


@router.post("/levels/{level_id}/notes/read")
async def mark_level_notes_read(
    level_id: str,
    payload: Optional[ReadNoteRequest] = None,
    user_id: Optional[str] = Query("00000000-0000-0000-0000-000000000001"),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks Level Notes as read in user_course_progress.
    """
    target_user_id = (payload and payload.user_id) or user_id or "00000000-0000-0000-0000-000000000001"

    # Identify track
    lvl_res = await db.execute(select(Level).where(Level.id == level_id))
    level = lvl_res.scalars().first()
    track_code = level.track if level else (level_id.split("-")[0].upper() if "-" in level_id else "EEE")

    prog_res = await db.execute(
        select(UserCourseProgress).where(
            UserCourseProgress.user_id == target_user_id,
            UserCourseProgress.track == track_code
        )
    )
    prog = prog_res.scalars().first()

    if not prog:
        prog = UserCourseProgress(
            user_id=target_user_id,
            track=track_code,
            completed_level_ids=[],
            stars_earned_json={},
            unlocked_level_number=1,
            read_notes_level_ids=[level_id],
            completed_knowledge_quest_ids=[],
        )
        db.add(prog)
    else:
        current_read = list(prog.read_notes_level_ids or [])
        if level_id not in current_read:
            current_read.append(level_id)
            prog.read_notes_level_ids = current_read

    await db.commit()
    return {
        "status": "success",
        "level_id": level_id,
        "read_notes_level_ids": prog.read_notes_level_ids,
    }


# ==============================================================================
# 2. KNOWLEDGE QUEST ENDPOINTS
# ==============================================================================

@router.get("/tracks/{track}/knowledge-quest/{module_index}", response_model=KnowledgeQuestResponse)
async def get_knowledge_quest(
    track: str,
    module_index: int,
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches the 10-level concept synthesis and interactive flashcards deck
    required before unlocking the Module Boss.
    Guarantees 200 OK fallback if not explicitly seeded.
    """
    track_code = track.upper()

    # 1. Fetch Quest from DB
    quest_res = await db.execute(
        select(KnowledgeQuest).where(
            KnowledgeQuest.track == track_code,
            KnowledgeQuest.module_index == module_index
        )
    )
    quest = quest_res.scalars().first()

    # 2. Check if completed by user
    prog_res = await db.execute(
        select(UserCourseProgress).where(
            UserCourseProgress.user_id == user_id,
            UserCourseProgress.track == track_code
        )
    )
    prog = prog_res.scalars().first()
    completed_quests = set(prog.completed_knowledge_quest_ids or []) if prog else set()
    is_completed = (module_index in completed_quests) or (str(module_index) in completed_quests) or (f"{track_code}-{module_index}" in completed_quests)

    if quest:
        return KnowledgeQuestResponse(
            id=quest.id,
            track=quest.track,
            module_index=quest.module_index,
            title=quest.title,
            recap_summary=quest.recap_summary,
            concept_breakdown=quest.concept_breakdown or [],
            key_formulas=quest.key_formulas or [],
            practice_flashcards=quest.practice_flashcards or [],
            unlocked_after_level_number=quest.unlocked_after_level_number,
            is_completed=is_completed,
        )

    # 3. Fallback: generate high-quality 200 OK revision payload
    fallback_data = generate_fallback_knowledge_quest(track_code, module_index)
    fallback_data["is_completed"] = is_completed
    return KnowledgeQuestResponse(**fallback_data)


class KnowledgeQuestCompleteRequest(BaseModel):
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001"


@router.post("/tracks/{track}/knowledge-quest/{module_index}/complete")
async def complete_knowledge_quest(
    track: str,
    module_index: int,
    payload: Optional[KnowledgeQuestCompleteRequest] = None,
    user_id: Optional[str] = Query("00000000-0000-0000-0000-000000000001"),
    db: AsyncSession = Depends(get_db)
):
    """
    Marks Knowledge Quest complete, awards bonus Spark Coins (+50) and XP (+100),
    and unlocks the Module Boss challenge.
    """
    target_user_id = (payload and payload.user_id) or user_id or "00000000-0000-0000-0000-000000000001"
    track_code = track.upper()

    # 1. Update Progress
    prog_res = await db.execute(
        select(UserCourseProgress).where(
            UserCourseProgress.user_id == target_user_id,
            UserCourseProgress.track == track_code
        )
    )
    prog = prog_res.scalars().first()

    if not prog:
        prog = UserCourseProgress(
            user_id=target_user_id,
            track=track_code,
            completed_level_ids=[],
            stars_earned_json={},
            unlocked_level_number=1,
            read_notes_level_ids=[],
            completed_knowledge_quest_ids=[module_index],
        )
        db.add(prog)
    else:
        current_completed = list(prog.completed_knowledge_quest_ids or [])
        if module_index not in current_completed and str(module_index) not in current_completed:
            current_completed.append(module_index)
            prog.completed_knowledge_quest_ids = current_completed

    # 2. Award Spark Coins & XP to Profile
    prof_res = await db.execute(select(Profile).where(Profile.id == target_user_id))
    profile = prof_res.scalars().first()
    coins_awarded = 50
    xp_awarded = 100
    if profile:
        profile.spark_coins = (profile.spark_coins or 0) + coins_awarded
        profile.xp = (profile.xp or 0) + xp_awarded

    await db.commit()

    return {
        "status": "success",
        "track": track_code,
        "module_index": module_index,
        "spark_coins_awarded": coins_awarded,
        "xp_awarded": xp_awarded,
        "boss_unlocked": True,
        "completed_knowledge_quest_ids": prog.completed_knowledge_quest_ids,
    }
