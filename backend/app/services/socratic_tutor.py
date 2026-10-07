"""
Socratic Tutor & Intent Classification Engine for Spike the Engineering Rhino.
Classifies student messages into explicit intents, orchestrates dynamic persona prompts,
and prevents challenge context leaks for casual or off-topic inquiries.
"""

import os
import re
import asyncio
from typing import Dict, Any, Optional
import httpx

GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-1.5-pro")
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-1.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# 8 Explicit Intent Classes
INTENT_GREETING_CASUAL = "GREETING_CASUAL"
INTENT_HINT_REQUEST = "HINT_REQUEST"
INTENT_CONCEPT_EXPLANATION = "CONCEPT_EXPLANATION"
INTENT_WRONG_ANSWER_INQUIRY = "WRONG_ANSWER_INQUIRY"
INTENT_LEVEL_NOTES_HELP = "LEVEL_NOTES_HELP"
INTENT_KNOWLEDGE_QUEST_HELP = "KNOWLEDGE_QUEST_HELP"
INTENT_WEAK_SKILL_INQUIRY = "WEAK_SKILL_INQUIRY"
INTENT_OFF_TOPIC = "OFF_TOPIC"

VALID_INTENTS = {
    INTENT_GREETING_CASUAL,
    INTENT_HINT_REQUEST,
    INTENT_CONCEPT_EXPLANATION,
    INTENT_WRONG_ANSWER_INQUIRY,
    INTENT_LEVEL_NOTES_HELP,
    INTENT_KNOWLEDGE_QUEST_HELP,
    INTENT_WEAK_SKILL_INQUIRY,
    INTENT_OFF_TOPIC,
}


class SocraticTutorEngine:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.pro_model = GEMINI_PRO_MODEL
        self.flash_model = GEMINI_FLASH_MODEL

    def classify_intent_regex(
        self,
        message: str,
        active_view: Optional[str] = "WORKBENCH"
    ) -> str:
        """
        Fast deterministic regex intent classification.
        Used as instant fast-pass and automatic fallback when Gemini is unavailable.
        """
        msg = (message or "").strip().lower()

        # 1. GREETING_CASUAL
        greeting_patterns = [
            r"^(hi|hello|hey|howdy|sup|hiya|greetings|good\s+(morning|afternoon|evening|day))\b[!?.]*$",
            r"^(hi|hello|hey)\s+(spike|rhino|there|friend|buddy|bot|tutor)[!?.]*$",
            r"^(who\s+are\s+you|what\s+is\s+your\s+name|how\s+are\s+you|nice\s+to\s+meet\s+you)[!?.]*$",
        ]
        for pat in greeting_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_GREETING_CASUAL

        # 2. OFF_TOPIC
        off_topic_patterns = [
            r"\b(poem|write\s+a\s+poem|story|who\s+won|football|cricket|basketball|movie|weather|sing|joke|dance|politics|president)\b",
        ]
        for pat in off_topic_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_OFF_TOPIC

        # 3. WEAK_SKILL_INQUIRY
        weak_skill_patterns = [
            r"\b(weak\s*skill|weakest\s*topic|bkt|score\s*drop|dropped|mastery|what\s*should\s*i\s*practice|topics?\s*to\s*practice|skill\s*decay)\b",
        ]
        for pat in weak_skill_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_WEAK_SKILL_INQUIRY

        # 4. KNOWLEDGE_QUEST_HELP
        if active_view == "KNOWLEDGE_QUEST":
            if any(k in msg for k in ["boss", "review", "summary", "summarize", "flashcard", "quest", "concept", "trial"]):
                return INTENT_KNOWLEDGE_QUEST_HELP
        kq_patterns = [
            r"\b(knowledge\s*quest|trial\s*of\s*knowledge|review\s*for\s*(the\s*)?boss|prepare\s*for\s*(the\s*)?boss|summarize\s*(the\s*)?(last\s*)?10\s*levels|module\s*boss)\b",
        ]
        for pat in kq_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_KNOWLEDGE_QUEST_HELP

        # 5. LEVEL_NOTES_HELP
        if active_view == "LEVEL_NOTES":
            if any(k in msg for k in ["note", "notes", "formula", "worked example", "primer", "real world", "connection", "explain this"]):
                return INTENT_LEVEL_NOTES_HELP
        notes_patterns = [
            r"\b(level\s*notes?|mission\s*primer|formula\s*in\s*the\s*notes?|worked\s*example|real[- ]world\s*connection|takeaways?)\b",
        ]
        for pat in notes_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_LEVEL_NOTES_HELP

        # 6. WRONG_ANSWER_INQUIRY
        wrong_patterns = [
            r"\b(why\s*(is|did|are)\s*my\s*(output|voltage|current|simulation|code|result|answer)\s*(wrong|incorrect|failing|failed))\b",
            r"\b(error\s*code|simulation\s*failed|voltage\s*output\s*incorrect|failed\s*test)\b",
        ]
        for pat in wrong_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_WRONG_ANSWER_INQUIRY

        # 7. HINT_REQUEST
        hint_patterns = [
            r"\b(hint|give\s*me\s*a\s*hint|need\s*a\s*hint|help\s*me\s*with\s*step|stuck|nudge|guide\s*me|clue)\b",
        ]
        for pat in hint_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_HINT_REQUEST

        # 8. CONCEPT_EXPLANATION
        concept_patterns = [
            r"\b(explain|what\s*is|what\s*are|how\s*does|definition\s*of|formula\s*for|tell\s*me\s*about|example\s*of)\b",
        ]
        for pat in concept_patterns:
            if re.search(pat, msg, re.IGNORECASE):
                return INTENT_CONCEPT_EXPLANATION

        # View-based defaults
        if active_view == "LEVEL_NOTES":
            return INTENT_LEVEL_NOTES_HELP
        elif active_view == "KNOWLEDGE_QUEST":
            return INTENT_KNOWLEDGE_QUEST_HELP

        return INTENT_HINT_REQUEST

    async def classify_intent(
        self,
        message: str,
        active_view: Optional[str] = "WORKBENCH"
    ) -> str:
        """
        Classifies incoming user message using fast regex matching first,
        falling back or using Gemini Fast Classifier with <1.5s timeout.
        """
        clean_msg = (message or "").strip()
        # Fast pass: check if regex immediately resolves high-confidence matches
        regex_intent = self.classify_intent_regex(clean_msg, active_view)
        if regex_intent in [
            INTENT_GREETING_CASUAL,
            INTENT_OFF_TOPIC,
            INTENT_WEAK_SKILL_INQUIRY,
            INTENT_LEVEL_NOTES_HELP,
            INTENT_KNOWLEDGE_QUEST_HELP
        ]:
            return regex_intent

        if self.api_key:
            try:
                system_prompt = (
                    "You are an AI Intent Classifier for an engineering education platform. "
                    "Classify the user message into EXACTLY one of these 8 categories:\n"
                    "- GREETING_CASUAL\n"
                    "- HINT_REQUEST\n"
                    "- CONCEPT_EXPLANATION\n"
                    "- WRONG_ANSWER_INQUIRY\n"
                    "- LEVEL_NOTES_HELP\n"
                    "- KNOWLEDGE_QUEST_HELP\n"
                    "- WEAK_SKILL_INQUIRY\n"
                    "- OFF_TOPIC\n"
                    "Respond with ONLY the exact category name."
                )
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.flash_model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{system_prompt}\nActive View: {active_view}\nUser Message: {clean_msg}"}
                        ]
                    }],
                    "generationConfig": {"temperature": 0.0, "maxOutputTokens": 20},
                }
                # Strict timeout <= 1.5s as required by directive
                async with httpx.AsyncClient(timeout=1.4) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            raw_cat = candidates[0]["content"]["parts"][0]["text"].strip()
                            clean_cat = raw_cat.replace("`", "").replace('"', "").replace("'", "").strip()
                            if clean_cat in VALID_INTENTS:
                                return clean_cat
            except Exception:
                # Automatic timeout or network fallback to regex
                pass

        return regex_intent

    async def generate_response(
        self,
        message: str,
        active_view: Optional[str] = "WORKBENCH",
        context_id: Optional[str] = "",
        spice_telemetry: Optional[Dict[str, Any]] = None,
        target_goal: Optional[Dict[str, Any]] = None,
        topic_tag: Optional[str] = "Circuit Analysis",
        notes_context: Optional[Dict[str, Any]] = None,
        quest_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Orchestrates dynamic Spike persona and prompt based on classified intent.
        Strictly prevents context leakage for GREETING_CASUAL and OFF_TOPIC.
        """
        intent = await self.classify_intent(message, active_view)

        # 1. GREETING_CASUAL: Warm, playful Rhino greeting without challenge jargon
        if intent == INTENT_GREETING_CASUAL:
            return {
                "persona": "Spike the Engineering Rhino",
                "intent": intent,
                "guidance": (
                    "🦏 **Spike says:** Hello there, intrepid engineer! Spike here, with my trusty pith helmet "
                    "and multimeter ready. Whether you're decoding circuits, tracing logic gates, or gearing up "
                    "for a Boss Mission, I'm here to guide your steps. What engineering puzzle are we tackling today? ⚡🦏"
                ),
            }

        # 2. OFF_TOPIC: Jungle / Rhino humor pivoting back to engineering
        if intent == INTENT_OFF_TOPIC:
            return {
                "persona": "Spike the Engineering Rhino",
                "intent": intent,
                "guidance": (
                    "🦏 **Spike says:** Haha, that's fun! But my horn only tunes into engineering frequencies and "
                    "circuit resonance! 🦏⚡ Let's channel that energy back into solving this challenge—what "
                    "engineering concept or equation can we conquer together?"
                ),
            }

        # 3. WEAK_SKILL_INQUIRY: BKT Mastery guidance
        if intent == INTENT_WEAK_SKILL_INQUIRY:
            return {
                "persona": "Spike the Engineering Rhino",
                "intent": intent,
                "guidance": (
                    f"🦏 **Spike says:** Let's inspect your skill mastery radar! Our Bayesian Knowledge Tracing (BKT) "
                    f"tracks your probability of skill mastery across topics. If you haven't practiced recently, time "
                    f"decay alerts you to refresh your fundamentals. Head to your Home Hub to launch an **Adaptive Practice Drill**, "
                    f"or review the **Level Notes** on your weaker nodes to bounce back to 100%! 📈⚡"
                ),
            }

        # 4. LEVEL_NOTES_HELP: Grounded in Level Notes context (NOT challenge netlist)
        if intent == INTENT_LEVEL_NOTES_HELP:
            return {
                "persona": "Spike the Engineering Rhino",
                "intent": intent,
                "guidance": self._build_level_notes_guidance(message, notes_context, topic_tag),
            }

        # 5. KNOWLEDGE_QUEST_HELP: Synthesized revision tips for Boss preparation
        if intent == INTENT_KNOWLEDGE_QUEST_HELP:
            return {
                "persona": "Spike the Engineering Rhino",
                "intent": intent,
                "guidance": self._build_knowledge_quest_guidance(message, quest_context, topic_tag),
            }

        # 6. CONCEPT_EXPLANATION: First principles with LaTeX formulas
        if intent == INTENT_CONCEPT_EXPLANATION:
            return {
                "persona": "Spike the Engineering Rhino",
                "intent": intent,
                "guidance": self._build_concept_explanation(message, topic_tag),
            }

        # 7. HINT_REQUEST or WRONG_ANSWER_INQUIRY: Socratic guidance with telemetry
        guidance = self._build_socratic_challenge_guidance(
            message=message,
            spice_telemetry=spice_telemetry or {},
            target_goal=target_goal or {},
            topic_tag=topic_tag or "Circuit Analysis",
            is_wrong_answer=(intent == INTENT_WRONG_ANSWER_INQUIRY),
        )

        return {
            "persona": "Spike the Engineering Rhino",
            "intent": intent,
            "guidance": guidance,
        }

    def _build_level_notes_guidance(
        self,
        message: str,
        notes: Optional[Dict[str, Any]],
        topic_tag: Optional[str]
    ) -> str:
        """Grounded guidance for Level Notes."""
        if notes:
            title = notes.get("title", "Level Notes")
            summary = notes.get("summary", "")
            formulas = notes.get("formulas_rules", [])
            f_str = ""
            if formulas:
                default_latex = formulas[0].get("latex", "V = I * R")
                f_str = f" Remember the core formula: ${default_latex}$."
            rw = notes.get("real_world_connection", "")
            rw_str = f" In the real world, this is how {rw}." if rw else ""
            return (
                f"🦏 **Spike says:** In this lesson on **{title}**, notice how first principles connect together! "
                f"{summary}{f_str}{rw_str} "
                f"Which part of the worked example or formula would you like us to break down step-by-step?"
            )
        return (
            f"🦏 **Spike says:** Great question about the lesson notes! "
            f"When studying **{topic_tag}**, always link the governing equations to physical reality. "
            f"Review the worked example step-by-step, verify the units, and you'll be primed for the challenge! 📖⚡"
        )

    def _build_knowledge_quest_guidance(
        self,
        message: str,
        quest: Optional[Dict[str, Any]],
        topic_tag: Optional[str]
    ) -> str:
        """Synthesized revision tips for Boss preparation."""
        if quest:
            title = quest.get("title", "Trial of Knowledge")
            recap = quest.get("recap_summary", "")
            return (
                f"🦏 **Spike says:** Preparing for the Boss Mission? Excellent discipline, explorer! "
                f"In **{title}**, you've synthesized 10 levels of engineering mastery: {recap} "
                f"Flip through the flashcards to test your recall on key formulas, and remember: in the emergency scenario, "
                f"stay calm, check node potentials first, and calculate before you connect! 👑⚡"
            )
        return (
            f"🦏 **Spike says:** Preparing for the Module Boss is all about synthesizing what you've learned! "
            f"Review the 10 preceding levels, make sure you can calculate target values without guessing, "
            f"and flip through the revision flashcards. You've got the skills to save the station! 🦏👑"
        )

    def _build_concept_explanation(self, message: str, topic_tag: Optional[str]) -> str:
        """Conceptual explanation with LaTeX formulas."""
        msg_low = message.lower()
        if "ohm" in msg_low or "voltage" in msg_low or "resistance" in msg_low:
            return (
                "🦏 **Spike says:** **Ohm's Law** is the bedrock of electrical engineering: $V = I \\cdot R$. "
                "Electric potential difference ($V$ in Volts) pushes charge through a material, while resistance ($R$ in Ohms) opposes it. "
                "Think of it like water pressure: higher voltage pushes more current ($I$), but a narrower pipe (higher resistance) constricts the flow! ⚡"
            )
        elif "op-amp" in msg_low or "operational amplifier" in msg_low:
            return (
                "🦏 **Spike says:** An **Operational Amplifier (Op-Amp)** is an ultra-high gain DC differential amplifier. "
                "In negative feedback, its two golden rules are: (1) no current enters the inputs ($I_+ = I_- = 0$), and "
                "(2) the feedback drives the input voltages equal ($V_+ = V_-$). For an inverting amplifier, $A_v = -\\frac{R_f}{R_{in}}$!"
            )
        elif "resonance" in msg_low or "rlc" in msg_low or "frequency" in msg_low:
            return (
                "🦏 **Spike says:** **Resonance** occurs in an RLC circuit when inductive reactance $X_L = 2\\pi f L$ "
                "exactly cancels capacitive reactance $X_C = \\frac{1}{2\\pi f C}$! At this resonant frequency "
                "$f_0 = \\frac{1}{2\\pi\\sqrt{LC}}$, circuit impedance becomes purely resistive and energy oscillates between inductor and capacitor."
            )
        return (
            f"🦏 **Spike says:** In **{topic_tag}**, understanding first principles is key! "
            f"Every engineering system balances energy and conservation laws. What specific relationship or variable "
            f"in this concept are you curious about?"
        )

    def _build_socratic_challenge_guidance(
        self,
        message: str,
        spice_telemetry: Dict[str, Any],
        target_goal: Dict[str, Any],
        topic_tag: str,
        is_wrong_answer: bool = False,
    ) -> str:
        """Socratic tutoring referencing measurements without revealing solutions."""
        v_out = spice_telemetry.get("v_out")
        target_v = target_goal.get("target_voltage")
        f0 = spice_telemetry.get("f0_hz")
        target_f0 = target_goal.get("target_resonance_f0")
        gain = spice_telemetry.get("gain")
        target_gain = target_goal.get("target_gain")

        intro = "Notice what happened in your simulation! " if is_wrong_answer else ""

        if v_out is not None and target_v is not None:
            if v_out < target_v:
                return (
                    f"🦏 **Spike says:** {intro}Your measured voltage is ${v_out:.2f}\\text{{ V}}$, but we need "
                    f"${target_v}\\text{{ V}}$! Consider the voltage divider relation: "
                    f"$V_{{out}} = V_{{in}} \\cdot \\frac{{R_2}}{{R_1 + R_2}}$. If you decrease $R_1$ or increase $R_2$, "
                    f"how does that change the division ratio?"
                )
            else:
                return (
                    f"🦏 **Spike says:** {intro}Your output voltage is currently ${v_out:.2f}\\text{{ V}}$, which exceeds our target of "
                    f"${target_v}\\text{{ V}}$. How does increasing the resistance of the upper branch $R_1$ affect the current flowing into $R_2$? "
                    f"Test the ratio with $V = I \\cdot R$!"
                )
        elif f0 is not None and target_f0 is not None:
            return (
                f"🦏 **Spike says:** {intro}Your resonance is currently ${f0:.1f}\\text{{ Hz}}$, while the target is "
                f"${target_f0}\\text{{ Hz}}$. Recall that $f_0 = \\frac{{1}}{{2\\pi\\sqrt{{LC}}}}$. "
                f"Since frequency is inversely proportional to $\\sqrt{{C}}$, should you increase or decrease your capacitance?"
            )
        elif gain is not None and target_gain is not None:
            return (
                f"🦏 **Spike says:** {intro}The current amplifier gain is ${gain:.2f}$, but we require a magnitude of ${target_gain}$. "
                f"In an inverting op-amp configuration, $A_v = -\\frac{{R_f}}{{R_{{in}}}}$. Which resistor controls the negative feedback ratio?"
            )

        return (
            f"🦏 **Spike says:** Great question! Let's examine this from first principles. "
            f"What fundamental governing relationship links your inputs to the target state in {topic_tag}? "
            f"Trace the signal path and check your node equations!"
        )


# Global singleton instance
socratic_tutor = SocraticTutorEngine()
