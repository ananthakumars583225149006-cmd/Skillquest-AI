"""
Unit Tests for Spike AI Intent Classification, Dynamic Personas, and Companion Engine.
Tests that casual greetings return friendly responses without challenge jargon,
Level Notes context is utilized when viewing notes, and Knowledge Quest rewards work properly.
"""

import pytest
from app.services.socratic_tutor import (
    socratic_tutor,
    INTENT_GREETING_CASUAL,
    INTENT_OFF_TOPIC,
    INTENT_LEVEL_NOTES_HELP,
    INTENT_KNOWLEDGE_QUEST_HELP,
    INTENT_HINT_REQUEST,
    INTENT_CONCEPT_EXPLANATION,
    INTENT_WRONG_ANSWER_INQUIRY,
    INTENT_WEAK_SKILL_INQUIRY,
)


@pytest.mark.asyncio
async def test_casual_greeting_returns_friendly_rhino_without_challenge_jargon():
    """
    Test that 'Hi' or 'Hello' returns a friendly Spike greeting
    and NEVER injects SPICE netlist or challenge jargon.
    """
    greetings = ["Hi", "Hello", "Hey Spike!", "Good morning", "Who are you?"]
    for query in greetings:
        intent = await socratic_tutor.classify_intent(query, active_view="WORKBENCH")
        assert intent == INTENT_GREETING_CASUAL

        # Generate response passing SPICE measurements
        resp = await socratic_tutor.generate_response(
            message=query,
            active_view="WORKBENCH",
            spice_telemetry={"v_out": 3.75, "current_ma": 1.2},
            target_goal={"target_voltage": 5.0},
            topic_tag="Circuit Analysis",
        )
        assert resp["intent"] == INTENT_GREETING_CASUAL
        guidance = resp["guidance"].lower()
        # Verify friendly Rhino persona
        assert "spike" in guidance
        # Verify NO challenge netlist or SPICE leakage
        assert "v_out" not in guidance
        assert "3.75" not in guidance
        assert "5.0" not in guidance
        assert "resistor" not in guidance or "circuit" in guidance  # General friendly intro is okay, but not numerical hint


@pytest.mark.asyncio
async def test_off_topic_pivots_with_rhino_humor_without_leaks():
    """
    Test that off-topic inquiries gently pivot back without leaking challenge state.
    """
    off_topics = ["Write me a poem", "Who won the game yesterday?", "Tell me a joke"]
    for query in off_topics:
        intent = await socratic_tutor.classify_intent(query, active_view="WORKBENCH")
        assert intent == INTENT_OFF_TOPIC

        resp = await socratic_tutor.generate_response(
            message=query,
            active_view="WORKBENCH",
            spice_telemetry={"v_out": 2.5},
            target_goal={"target_voltage": 9.0},
        )
        assert resp["intent"] == INTENT_OFF_TOPIC
        guidance = resp["guidance"].lower()
        assert "horn" in guidance or "frequency" in guidance
        assert "2.5" not in guidance


@pytest.mark.asyncio
async def test_level_notes_help_uses_notes_context():
    """
    Test that asking for help with a formula inside Level Notes pulls from notes context.
    """
    notes_context = {
        "title": "DC Voltage Divider Primer",
        "summary": "Master potential drop across series resistors.",
        "formulas_rules": [{"label": "Voltage Divider", "latex": "V_{out} = V_{in} \\cdot \\frac{R_2}{R_1 + R_2}"}],
        "worked_example": {"solution": "Vout = 3.75V"},
        "real_world_connection": "smartphone charger voltage regulation",
    }
    query = "Help me understand the formula in the notes"
    intent = await socratic_tutor.classify_intent(query, active_view="LEVEL_NOTES")
    assert intent == INTENT_LEVEL_NOTES_HELP

    resp = await socratic_tutor.generate_response(
        message=query,
        active_view="LEVEL_NOTES",
        context_id="eee-lvl-1",
        notes_context=notes_context,
        topic_tag="Voltage Dividers",
    )
    assert resp["intent"] == INTENT_LEVEL_NOTES_HELP
    guidance = resp["guidance"]
    assert "DC Voltage Divider Primer" in guidance or "formula" in guidance.lower()
    assert "V_{out}" in guidance or "first principles" in guidance.lower()


@pytest.mark.asyncio
async def test_knowledge_quest_help_synthesizes_boss_review():
    """
    Test that Knowledge Quest queries provide synthesized revision tips for the Boss.
    """
    quest_context = {
        "title": "EEE Module 1: DC Foundations",
        "recap_summary": "10-level synthesis of Ohm's Law and Kirchhoff's Laws.",
    }
    query = "Help me review for the Boss"
    intent = await socratic_tutor.classify_intent(query, active_view="KNOWLEDGE_QUEST")
    assert intent == INTENT_KNOWLEDGE_QUEST_HELP

    resp = await socratic_tutor.generate_response(
        message=query,
        active_view="KNOWLEDGE_QUEST",
        context_id="1",
        quest_context=quest_context,
        topic_tag="Network Synthesis",
    )
    assert resp["intent"] == INTENT_KNOWLEDGE_QUEST_HELP
    guidance = resp["guidance"]
    assert "Boss" in guidance or "boss" in guidance.lower()
    assert "flashcard" in guidance.lower() or "formula" in guidance.lower() or "revision" in guidance.lower()


@pytest.mark.asyncio
async def test_wrong_answer_inquiry_provides_socratic_nudge():
    """
    Test that inquiring about a wrong answer gives Socratic guidance without giving away the direct answer.
    """
    query = "Why did my simulation fail? My voltage output is incorrect."
    intent = await socratic_tutor.classify_intent(query, active_view="WORKBENCH")
    assert intent in [INTENT_WRONG_ANSWER_INQUIRY, INTENT_HINT_REQUEST]

    resp = await socratic_tutor.generate_response(
        message=query,
        active_view="WORKBENCH",
        spice_telemetry={"v_out": 2.5},
        target_goal={"target_voltage": 5.0},
        topic_tag="Circuit Analysis",
    )
    guidance = resp["guidance"]
    assert "2.50" in guidance
    assert "5.0" in guidance
    # Socratic question mark present
    assert "?" in guidance
