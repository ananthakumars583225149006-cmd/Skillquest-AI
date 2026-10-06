"""
Gameplay, Level Progression, and Interactive Workbench Routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from ..db.database import get_db
from ..db.models import (
    Level, Challenge, UserCourseProgress, BKTTopicMastery,
    Profile, LeagueStanding, AdvancedMLTelemetry
)
from ..analytics.bkt_engine import bkt_engine
from ..simulation.spice_engine import spice_engine
from ..simulation.code_sandbox import code_sandbox
from ..simulation.truth_table import truth_table_verifier

router = APIRouter(prefix="/api/v1/play", tags=["Gameplay & Workbench"])


class ChallengeSubmitRequest(BaseModel):
    level_id: str
    challenge_id: str
    submission_data: Dict[str, Any]


@router.get("/tracks")
async def get_all_tracks_summary(user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    """Provides summary of all 3 tracks for the Home Hub."""
    tracks_info = []
    for trk, meta in [("EEE", {"color": "#F97316", "name": "Electrical & Electronics Engineering"}),
                      ("CSE", {"color": "#A855F7", "name": "Computer Science Engineering"}),
                      ("ECE", {"color": "#F59E0B", "name": "Electronics & Communication Engineering"})]:
        prog_res = await db.execute(
            select(UserCourseProgress).where(
                UserCourseProgress.user_id == user_id,
                UserCourseProgress.track == trk
            )
        )
        prog = prog_res.scalars().first()
        completed_count = len(prog.completed_level_ids) if prog else 0
        unlocked_lvl = prog.unlocked_level_number if prog else 1

        tracks_info.append({
            "track": trk,
            "name": meta["name"],
            "accent_color": meta["color"],
            "total_levels": 30,
            "completed_levels": completed_count,
            "unlocked_level_number": unlocked_lvl,
            "progress_percent": round((completed_count / 30.0) * 100, 1),
            "badge_text": "30 MVP Levels Ready",
        })
    return {"tracks": tracks_info}


@router.get("/track-progress/{track}")
async def get_track_progress(track: str, user_id: Optional[str] = "00000000-0000-0000-0000-000000000001", db: AsyncSession = Depends(get_db)):
    """Fetches all 30 level nodes along the winding map for the selected track."""
    track_code = track.upper()
    prog_res = await db.execute(
        select(UserCourseProgress).where(
            UserCourseProgress.user_id == user_id,
            UserCourseProgress.track == track_code
        )
    )
    prog = prog_res.scalars().first()
    completed_ids = set(prog.completed_level_ids) if prog else set()
    stars_map = prog.stars_earned_json if prog else {}
    unlocked_lvl_num = prog.unlocked_level_number if prog else 1

    # Fetch levels
    levels_res = await db.execute(
        select(Level).where(Level.track == track_code).order_by(Level.level_number.asc())
    )
    levels = levels_res.scalars().all()

    # Fetch BKT masteries to determine skill decay alerts
    bkt_res = await db.execute(
        select(BKTTopicMastery).where(
            BKTTopicMastery.user_id == user_id,
            BKTTopicMastery.track == track_code
        )
    )
    masteries = {m.topic_tag: m for m in bkt_res.scalars().all()}

    nodes = []
    for lvl in levels:
        is_completed = lvl.id in completed_ids
        is_unlocked = lvl.level_number <= unlocked_lvl_num
        stars = stars_map.get(lvl.id, 0) if is_completed else 0

        # Check decay alert
        has_decay_alert = False
        mastery_val = 0.30
        if lvl.topic_tag in masteries:
            m = masteries[lvl.topic_tag]
            mastery_val = m.p_mastery
            effective_score, is_decayed = bkt_engine.calculate_decayed_score(m.p_mastery, m.last_decay_timestamp)
            if is_completed and is_decayed:
                has_decay_alert = True

        nodes.append({
            "id": lvl.id,
            "level_number": lvl.level_number,
            "module_index": lvl.module_index,
            "title": lvl.title,
            "topic_tag": lvl.topic_tag,
            "learning_objective": lvl.learning_objective,
            "is_boss_level": lvl.is_boss_level,
            "boss_scenario_brief": lvl.boss_scenario_brief,
            "is_unlocked": is_unlocked,
            "is_completed": is_completed,
            "stars": stars,
            "xp_reward": lvl.xp_reward,
            "coin_reward": lvl.coin_reward,
            "has_decay_alert": has_decay_alert,
            "mastery_score": mastery_val,
        })

    return {
        "track": track_code,
        "unlocked_level_number": unlocked_lvl_num,
        "completed_count": len(completed_ids),
        "levels": nodes,
    }


@router.get("/level/{level_id}")
async def get_level_details(level_id: str, db: AsyncSession = Depends(get_db)):
    """Fetches micro-lesson markdown and all challenges for a level."""
    lvl_res = await db.execute(select(Level).where(Level.id == level_id))
    level = lvl_res.scalars().first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    ch_res = await db.execute(
        select(Challenge).where(Challenge.level_id == level_id).order_by(Challenge.order_index.asc())
    )
    challenges = ch_res.scalars().all()

    return {
        "id": level.id,
        "track": level.track,
        "module_index": level.module_index,
        "level_number": level.level_number,
        "title": level.title,
        "topic_tag": level.topic_tag,
        "learning_objective": level.learning_objective,
        "prerequisite": level.prerequisite,
        "short_lesson_markdown": level.short_lesson_markdown,
        "is_boss_level": level.is_boss_level,
        "boss_scenario_brief": level.boss_scenario_brief,
        "xp_reward": level.xp_reward,
        "coin_reward": level.coin_reward,
        "challenges": [
            {
                "id": c.id,
                "order_index": c.order_index,
                "challenge_type": c.challenge_type,
                "prompt_text": c.prompt_text,
                "initial_state": c.initial_state_json,
                "target_state": c.target_state_json,
                "hints": c.hints_json,
                "difficulty_rating": c.difficulty_rating,
            }
            for c in challenges
        ],
    }


@router.post("/challenge/submit")
async def submit_challenge(
    payload: ChallengeSubmitRequest,
    user_id: Optional[str] = "00000000-0000-0000-0000-000000000001",
    db: AsyncSession = Depends(get_db)
):
    """
    Deterministically evaluates student challenge submission, updates BKT mastery,
    awards XP and Coins, adjusts health hearts, and records telemetry.
    """
    ch_res = await db.execute(select(Challenge).where(Challenge.id == payload.challenge_id))
    challenge = ch_res.scalars().first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    lvl_res = await db.execute(select(Level).where(Level.id == challenge.level_id))
    level = lvl_res.scalars().first()

    prof_res = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = prof_res.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    submission = payload.submission_data
    target = challenge.target_state_json

    # 1. Deterministic Simulation Evaluation
    eval_result = {"is_correct": False, "feedback": "", "measurements": {}}

    if challenge.challenge_type == "SPICE_CIRCUIT":
        netlist = submission.get("netlist", "")
        # If student submitted component values directly
        if not netlist and "r1" in submission and "r2" in submission:
            r1 = float(submission["r1"])
            r2 = float(submission["r2"])
            vin = float(submission.get("v_in", 12.0))
            dc = spice_engine.evaluate_dc_divider(vin, r1, r2)
            eval_result["measurements"] = dc
            target_v = float(target.get("target_voltage", 5.0))
            diff = abs(dc["v_out"] - target_v)
            is_correct = diff <= (target_v * 0.05 + 0.05)
            eval_result["is_correct"] = is_correct
            eval_result["feedback"] = "SPICE Verified! Node voltages match target." if is_correct else f"V_out = {dc['v_out']}V, needed ~{target_v}V."
        else:
            eval_result = spice_engine.run_netlist_simulation(netlist, target)

    elif challenge.challenge_type == "PHASOR_ALIGN":
        r = float(submission.get("r", 50))
        l = spice_engine.parse_numeric(submission.get("l", 1e-3))
        c = spice_engine.parse_numeric(submission.get("c", 10e-9))
        meas = spice_engine.evaluate_ac_rlc_resonance(r, l, c)
        eval_result["measurements"] = meas
        target_f0 = float(target.get("target_resonance_f0", 1000.0))
        is_ok = abs(meas["f0_hz"] - target_f0) <= (target_f0 * 0.08)
        eval_result["is_correct"] = is_ok
        eval_result["feedback"] = f"Resonance f0 = {meas['f0_hz']} Hz matched!" if is_ok else f"Current f0 = {meas['f0_hz']} Hz; target is {target_f0} Hz."

    elif challenge.challenge_type == "CODE_DEBUG":
        code = submission.get("code", "")
        assertions = target.get("assertions", [])
        eval_result = code_sandbox.execute_and_assert(code, assertions)

    elif challenge.challenge_type == "TRUTH_TABLE":
        submitted_table = submission.get("submitted_table", [])
        expected_table = target.get("expected_table", [])
        eval_result = truth_table_verifier.verify_truth_table(submitted_table, expected_table)

    elif challenge.challenge_type == "SLIDER_TUNING":
        # Check custom slider targets (e.g., gain, frequency, Q-point)
        if "target_gain" in target:
            rin = float(submission.get("rin", 10000))
            rf = float(submission.get("rf", 20000))
            opamp = spice_engine.evaluate_opamp_circuit("inverting", rin, rf, 1.0)
            eval_result["measurements"] = opamp
            t_gain = float(target["target_gain"])
            is_match = abs(abs(opamp["gain"]) - abs(t_gain)) < 0.15
            eval_result["is_correct"] = is_match
            eval_result["feedback"] = "Op-Amp Av gain aligned!" if is_match else f"Gain Av = {opamp['gain']}, target = {t_gain}"
        elif "min_sampling_freq" in target:
            fs = float(submission.get("sampling_freq", 0))
            min_fs = float(target["min_sampling_freq"])
            is_match = fs >= min_fs
            eval_result["is_correct"] = is_match
            eval_result["feedback"] = "Nyquist criterion satisfied!" if is_match else f"Sampling rate {fs} Hz is below Nyquist limit {min_fs} Hz."
        else:
            eval_result["is_correct"] = True
            eval_result["feedback"] = "Parameter values verified!"

    is_correct = eval_result.get("is_correct", False)

    # 2. Update BKT Topic Mastery
    bkt_res = await db.execute(
        select(BKTTopicMastery).where(
            BKTTopicMastery.user_id == user_id,
            BKTTopicMastery.topic_tag == level.topic_tag
        )
    )
    mastery = bkt_res.scalars().first()
    curr_p = mastery.p_mastery if mastery else 0.30
    next_p = bkt_engine.update_mastery(curr_p, is_correct)

    if mastery:
        mastery.p_mastery = next_p
        mastery.last_decay_timestamp = datetime.now(timezone.utc)
    else:
        new_mastery = BKTTopicMastery(
            user_id=user_id,
            track=level.track,
            topic_tag=level.topic_tag,
            p_mastery=next_p,
            last_decay_timestamp=datetime.now(timezone.utc),
        )
        db.add(new_mastery)

    # 3. Rewards & Hearts
    xp_earned = 0
    coins_earned = 0
    level_completed = False

    if is_correct:
        xp_earned = 25 if not level.is_boss_level else 50
        coins_earned = 5 if not level.is_boss_level else 15
        profile.xp += xp_earned
        profile.spark_coins += coins_earned

        # Check course progress
        prog_res = await db.execute(
            select(UserCourseProgress).where(
                UserCourseProgress.user_id == user_id,
                UserCourseProgress.track == level.track
            )
        )
        prog = prog_res.scalars().first()
        if prog:
            comp_list = list(prog.completed_level_ids or [])
            if level.id not in comp_list:
                comp_list.append(level.id)
                prog.completed_level_ids = comp_list
                # Update stars
                stars_dict = dict(prog.stars_earned_json or {})
                stars_dict[level.id] = 3
                prog.stars_earned_json = stars_dict
                if level.level_number >= prog.unlocked_level_number and prog.unlocked_level_number < 30:
                    prog.unlocked_level_number = level.level_number + 1
                level_completed = True
                # Bonus for level completion
                profile.xp += level.xp_reward
                profile.spark_coins += level.coin_reward
                xp_earned += level.xp_reward
                coins_earned += level.coin_reward
    else:
        # Deduct heart if wrong
        if profile.hearts > 0:
            profile.hearts -= 1

    # 4. Log behavioral telemetry hook
    telemetry = AdvancedMLTelemetry(
        user_id=user_id,
        raw_feature_vector={
            "challenge_id": challenge.id,
            "level_id": level.id,
            "track": level.track,
            "is_correct": is_correct,
            "prior_mastery": curr_p,
            "updated_mastery": next_p,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )
    db.add(telemetry)

    # Update league weekly XP
    standing_res = await db.execute(select(LeagueStanding).where(LeagueStanding.user_id == user_id))
    standing = standing_res.scalars().first()
    if standing and xp_earned > 0:
        standing.weekly_xp += xp_earned

    await db.commit()

    return {
        "is_correct": is_correct,
        "measurements": eval_result.get("measurements", {}),
        "feedback": eval_result.get("feedback", ""),
        "error": eval_result.get("error"),
        "stdout": eval_result.get("stdout"),
        "xp_earned": xp_earned,
        "coins_earned": coins_earned,
        "total_xp": profile.xp,
        "total_coins": profile.spark_coins,
        "hearts_left": profile.hearts,
        "mastery_score": next_p,
        "level_completed": level_completed,
    }
