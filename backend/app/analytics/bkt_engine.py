"""
Bayesian Knowledge Tracing (BKT) Engine
Implements standard cognitive student modeling with probabilistic updating and exponential time decay.
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, Tuple

# Default standard BKT parameters
DEFAULT_P_L0 = 0.30   # Prior probability of mastery
DEFAULT_P_TRANSIT = 0.15  # P(T): Probability of learning/transitioning between states
DEFAULT_P_GUESS = 0.20    # P(G): Probability of guessing correctly without mastery
DEFAULT_P_SLIP = 0.10     # P(S): Probability of making an error despite mastery
DEFAULT_DECAY_LAMBDA = 0.03  # Lambda decay factor per day (half-life approx 23 days)
DECAY_ALERT_THRESHOLD = 0.60  # Threshold under which decay ring triggers (#EF4444)


class BKTEngine:
    def __init__(
        self,
        p_transit: float = DEFAULT_P_TRANSIT,
        p_guess: float = DEFAULT_P_GUESS,
        p_slip: float = DEFAULT_P_SLIP,
        decay_lambda: float = DEFAULT_DECAY_LAMBDA,
    ):
        self.p_t = p_transit
        self.p_g = p_guess
        self.p_s = p_slip
        self.decay_lambda = decay_lambda

    def update_mastery(self, current_p: float, is_correct: bool) -> float:
        """
        Updates topic mastery probability P(L_t) following an observation (Correct / Incorrect).
        Clamps probability between [0.01, 0.99] to prevent mathematical saturation.
        """
        p_prev = max(0.01, min(0.99, current_p))

        if is_correct:
            # P(L_t | Correct) = (P(L_{t-1}) * (1 - P(S))) / (P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G))
            num = p_prev * (1.0 - self.p_s)
            denom = num + (1.0 - p_prev) * self.p_g
            p_posterior = num / denom if denom > 0 else p_prev
        else:
            # P(L_t | Incorrect) = (P(L_{t-1}) * P(S)) / (P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G)))
            num = p_prev * self.p_s
            denom = num + (1.0 - p_prev) * (1.0 - self.p_g)
            p_posterior = num / denom if denom > 0 else p_prev

        # Transition step: P(L_t) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
        p_next = p_posterior + (1.0 - p_posterior) * self.p_t

        return round(max(0.01, min(0.99, p_next)), 4)

    def calculate_decayed_score(
        self,
        p_mastery: float,
        last_updated_at: datetime,
        current_time: datetime = None,
    ) -> Tuple[float, bool]:
        """
        Calculates MasteryScore(t) = P(L_t) * exp(-lambda * delta_t_in_days).
        Returns (effective_mastery_score, has_decay_alert).
        """
        if current_time is None:
            current_time = datetime.now(timezone.utc)

        if last_updated_at.tzinfo is None:
            last_updated_at = last_updated_at.replace(tzinfo=timezone.utc)

        delta_seconds = max(0.0, (current_time - last_updated_at).total_seconds())
        delta_days = delta_seconds / 86400.0

        decay_multiplier = math.exp(-self.decay_lambda * delta_days)
        decayed_score = round(p_mastery * decay_multiplier, 4)
        is_decayed = decayed_score < DECAY_ALERT_THRESHOLD

        return decayed_score, is_decayed


# Singleton engine instance
bkt_engine = BKTEngine()
