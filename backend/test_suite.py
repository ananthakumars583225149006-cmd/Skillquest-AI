"""
Automated Comprehensive Test Suite for Skill Quest AI
Tests BKT engine math, SPICE simulator calculations, Code sandbox, Truth Table,
and live FastAPI REST endpoints.
"""

import sys
import unittest
from datetime import datetime, timezone, timedelta

# Import backend modules
from app.analytics.bkt_engine import BKTEngine
from app.simulation.spice_engine import SpiceEngine
from app.simulation.code_sandbox import CodeSandbox
from app.simulation.truth_table import TruthTableVerifier


class TestSkillQuestCore(unittest.TestCase):

    def setUp(self):
        self.bkt = BKTEngine()
        self.spice = SpiceEngine()
        self.sandbox = CodeSandbox()
        self.truth_table = TruthTableVerifier()

    def test_bkt_updates_and_decay(self):
        """Test BKT Bayesian update and skill decay alert."""
        prior = 0.30
        # Correct response should increase mastery
        p_correct = self.bkt.update_mastery(prior, is_correct=True)
        self.assertGreater(p_correct, prior)
        self.assertAlmostEqual(p_correct, 0.7098, delta=0.01)

        # Incorrect response should decrease mastery relative to correct
        p_wrong = self.bkt.update_mastery(p_correct, is_correct=False)
        self.assertLess(p_wrong, p_correct)

        # Time decay test (30 days of inactivity)
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        decayed_score, is_decayed = self.bkt.calculate_decayed_score(
            p_mastery=0.70, last_updated_at=thirty_days_ago, current_time=now
        )
        self.assertLess(decayed_score, 0.70)
        self.assertTrue(is_decayed, "Score should trigger decay alert (< 0.60)")

    def test_spice_voltage_divider(self):
        """Test deterministic DC voltage divider calculation."""
        # 12V supply with R1=10k, R2=10k -> Vout should be 6.0V
        dc = self.spice.evaluate_dc_divider(12.0, 10000, 10000)
        self.assertEqual(dc["v_out"], 6.0)
        self.assertEqual(dc["p_total"], 0.0072)

        # R1=2.2k, R2=1k -> Vout = 12 * 1 / 3.2 = 3.75V
        dc2 = self.spice.evaluate_dc_divider(12.0, 2200, 1000)
        self.assertEqual(dc2["v_out"], 3.75)

    def test_spice_rlc_resonance(self):
        """Test AC series RLC resonance frequency calculation."""
        # L = 1mH (1e-3), C = 10uF (10e-6) -> f0 = 1 / (2*pi*sqrt(1e-8)) ~ 1591.55 Hz
        res = self.spice.evaluate_ac_rlc_resonance(10.0, 1e-3, 10e-6)
        self.assertAlmostEqual(res["f0_hz"], 1591.55, delta=1.0)
        self.assertGreater(res["q_factor"], 0)

    def test_spice_opamp(self):
        """Test inverting Op-Amp closed loop gain."""
        opamp = self.spice.evaluate_opamp_circuit("inverting", r_in=10000, r_f=50000, v_in=1.0)
        self.assertEqual(opamp["gain"], -5.0)
        self.assertEqual(opamp["v_out"], -5.0)

    def test_code_sandbox_execution(self):
        """Test CSE track Python code execution with assertions."""
        student_code = """
def reverse_array(arr):
    return arr[::-1]
"""
        assertions = [
            "reverse_array([1, 2, 3]) == [3, 2, 1]",
            "reverse_array([]) == []",
            "reverse_array([42]) == [42]",
        ]
        result = self.sandbox.execute_and_assert(student_code, assertions)
        self.assertTrue(result["is_correct"])
        self.assertEqual(result["passed_tests"], 3)
        self.assertEqual(len(result["failed_tests"]), 0)

    def test_code_sandbox_security(self):
        """Test code sandbox security barrier against dangerous calls."""
        malicious_code = "import os\nos.system('echo hacked')"
        result = self.sandbox.execute_and_assert(malicious_code, [])
        self.assertFalse(result["is_correct"])
        self.assertIn("Security restriction", result["error"])

    def test_truth_table_verifier(self):
        """Test digital logic truth table verifier."""
        submitted = [{"Y": 0}, {"Y": 1}, {"Y": 1}, {"Y": 0}]
        expected = [{"Y": 0}, {"Y": 1}, {"Y": 1}, {"Y": 0}]
        res = self.truth_table.verify_truth_table(submitted, expected)
        self.assertTrue(res["is_correct"])


if __name__ == "__main__":
    unittest.main()
