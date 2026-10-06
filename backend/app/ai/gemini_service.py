"""
Google Gemini AI Service & Socratic Guidance Engine for Spike the Engineering Rhino.
Integrates with Google Gemini API using configurable model aliases, with deterministic
offline fallback personas for seamless testing without mandatory API keys.
"""

import os
import httpx
from typing import Dict, Any, Optional

GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-1.5-pro")
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-1.5-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


class GeminiService:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.pro_model = GEMINI_PRO_MODEL
        self.flash_model = GEMINI_FLASH_MODEL

    async def get_socratic_guidance(
        self,
        spice_telemetry: Dict[str, Any],
        target_goal: Dict[str, Any],
        user_query: str,
        topic_tag: str = "Circuit Analysis",
    ) -> str:
        """
        Generates Socratic guidance from Spike the Engineering Rhino.
        Never gives away the direct numerical answer.
        Asks 1-2 guiding questions rooted in deterministic simulation measurements.
        """
        prompt = f"""You are Spike the Engineering Rhino, the friendly, enthusiastic Socratic AI Tutor for Skill Quest AI!
Engineering Domain: {topic_tag}
Ground Truth Deterministic Simulation Telemetry: {spice_telemetry}
Target Goal: {target_goal}
Student's Question / State: {user_query}

Directives:
1. Speak as Spike the Rhino (warm, encouraging, cheerful engineer companion).
2. NEVER give the direct numerical answer or direct code fix.
3. Ask 1-2 sharp Socratic guiding questions that lead the student to identify where their calculation or topology is off.
4. Use standard LaTeX notation for formulas (e.g. $V = I \\cdot R$, $f_0 = \\frac{{1}}{{2\\pi\\sqrt{{LC}}}}$).
5. Keep it concise (under 120 words).
"""
        if self.api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.pro_model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.4, "maxOutputTokens": 300},
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            return candidates[0]["content"]["parts"][0]["text"].strip()
            except Exception as e:
                # Log and fallback gracefully
                pass

        # Deterministic High-Quality Fallback Socratic Guidance (Spike Persona)
        return self._build_offline_socratic_hint(spice_telemetry, target_goal, user_query, topic_tag)

    async def generate_adaptive_drill(self, topic_tag: str, current_mastery: float) -> Dict[str, Any]:
        """
        Generates adaptive practice challenge targeted at lowest BKT topic mastery.
        """
        prompt = f"""Generate a quick adaptive engineering review question for topic: {topic_tag}.
Current student BKT mastery: {current_mastery:.2f}.
Format as JSON: {{"title": "...", "prompt": "...", "equation": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..."}}"""

        if self.api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.flash_model}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 400},
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        # Clean json markdown fences
                        if text.startswith("```json"):
                            text = text[7:]
                        if text.endswith("```"):
                            text = text[:-3]
                        import json
                        return json.loads(text.strip())
            except Exception:
                pass

        # Deterministic offline fallback drill
        return {
            "title": f"Targeted Review: {topic_tag}",
            "prompt": f"Let's strengthen your foundation in {topic_tag}! What fundamental relationship determines the equilibrium state?",
            "equation": "$V = I \\cdot R$ / $\\mathbf{Z} = R + jX$",
            "options": [
                "Conservation of Energy and Kirchhoff's Laws",
                "Arbitrary Open-Circuit Disconnection",
                "Ideal Infinite Source Impedance",
                "Non-linear Saturation without Feedback"
            ],
            "correct_index": 0,
            "explanation": "Kirchhoff's Laws enforce conservation of charge (KCL) and energy (KVL) at all circuit junctions.",
        }

    def _build_offline_socratic_hint(
        self,
        spice: Dict[str, Any],
        target: Dict[str, Any],
        query: str,
        topic: str,
    ) -> str:
        """Rule-based intelligent Socratic tutor when offline or no API key."""
        v_out = spice.get("v_out")
        target_v = target.get("target_voltage")
        f0 = spice.get("f0_hz")
        target_f0 = target.get("target_resonance_f0")
        gain = spice.get("gain")
        target_gain = target.get("target_gain")

        if v_out is not None and target_v is not None:
            if v_out < target_v:
                return (
                    f"🦏 **Spike says:** Notice how your measured voltage is ${v_out:.2f}\\text{{ V}}$, but we need "
                    f"${target_v}\\text{{ V}}$! Think about the voltage divider formula: "
                    f"$V_{{out}} = V_{{in}} \\cdot \\frac{{R_2}}{{R_1 + R_2}}$. If you increase the pull-up resistor $R_1$, "
                    f"what happens to the ratio? How could you adjust $R_2$ instead?"
                )
            else:
                return (
                    f"🦏 **Spike says:** Your voltage is currently ${v_out:.2f}\\text{{ V}}$, which is higher than our target of "
                    f"${target_v}\\text{{ V}}$. How does increasing the resistance of the upper branch affect the current flowing through $R_2$? "
                    f"Check your ratio with $V = I \\cdot R$!"
                )
        elif f0 is not None and target_f0 is not None:
            return (
                f"🦏 **Spike says:** Your resonance frequency is currently ${f0:.1f}\\text{{ Hz}}$, while our target is "
                f"${target_f0}\\text{{ Hz}}$. Remember that $f_0 = \\frac{{1}}{{2\\pi\\sqrt{{LC}}}}$. "
                f"Since frequency is inversely proportional to $\\sqrt{{C}}$, should you increase or decrease your tuning capacitance?"
            )
        elif gain is not None and target_gain is not None:
            return (
                f"🦏 **Spike says:** The amplifier gain is currently ${gain:.2f}$, but we require a magnitude of ${target_gain}$. "
                f"In an inverting op-amp configuration, $A_v = -\\frac{{R_f}}{{R_{{in}}}}$. Which resistor sets the negative feedback loop?"
            )

        return (
            f"🦏 **Spike says:** Great question! Let's break this down into first principles. "
            f"What fundamental governing equation links your control variable to the desired target? "
            f"Double-check your branch impedances and try nudging the component values!"
        )


# Global singleton instance
gemini_service = GeminiService()
