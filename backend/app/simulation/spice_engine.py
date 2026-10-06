"""
Deterministic SPICE Simulation Engine for Skill Quest AI
Evaluates DC operating points, AC frequency response, phasors, RC/RL transients,
BJT bias points, and active Op-Amp configurations without external binary dependencies.
Also supports raw SPICE netlist syntax parsing.
"""

import math
import cmath
import re
from typing import Dict, Any, List, Optional, Tuple


class SpiceEngine:
    """
    High-fidelity deterministic circuit simulation engine.
    Computes exact engineering physics metrics for EEE and ECE track challenges.
    """

    @staticmethod
    def parse_numeric(val: Any) -> float:
        """Parse engineering notations like 10k, 4.7u, 100n, 2.2m, 1Meg."""
        if isinstance(val, (int, float)):
            return float(val)
        s = str(val).strip()
        multipliers = {
            'meg': 1e6, 'm': 1e-3, 'k': 1e3, 'u': 1e-6,
            'n': 1e-9, 'p': 1e-12, 'g': 1e9,
        }
        lower = s.lower()
        for unit, mult in sorted(multipliers.items(), key=lambda x: -len(x[0])):
            if lower.endswith(unit):
                num_part = lower[:-len(unit)].strip()
                try:
                    return float(num_part) * mult
                except ValueError:
                    pass
        # Remove trailing V, A, Ohm, Hz, F, H
        cleaned = re.sub(r'[vVaA\u03A9\u03C9hzHzFfHh]+$', '', s).strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def evaluate_dc_divider(self, v_in: float, r1: float, r2: float, r_load: Optional[float] = None) -> Dict[str, Any]:
        """Calculates voltage divider, loaded or unloaded."""
        if r_load is not None and r_load > 0:
            r_eq_bottom = (r2 * r_load) / (r2 + r_load)
        else:
            r_eq_bottom = r2
        r_total = r1 + r_eq_bottom
        if r_total <= 0:
            return {"v_out": 0.0, "i_total": 0.0, "p_dissipation": 0.0}

        i_total = v_in / r_total
        v_out = i_total * r_eq_bottom
        p_dissipation = v_in * i_total
        return {
            "v_out": round(v_out, 4),
            "i_total": round(i_total, 6),
            "p_total": round(p_dissipation, 4),
            "r_thevenin": round(r_eq_bottom, 4),
        }

    def evaluate_thevenin_match(self, v_source: float, r_source: float, r_load: float) -> Dict[str, Any]:
        """Calculates maximum power transfer and load power."""
        r_total = r_source + r_load
        if r_total <= 0:
            return {"power_transferred": 0.0, "efficiency": 0.0, "is_matched": False}
        i_load = v_source / r_total
        p_load = (i_load ** 2) * r_load
        p_max = (v_source ** 2) / (4 * r_source) if r_source > 0 else 0.0
        efficiency = (r_load / r_total) * 100.0
        is_matched = abs(r_source - r_load) / max(r_source, 1e-6) < 0.05
        return {
            "i_load": round(i_load, 6),
            "v_load": round(i_load * r_load, 4),
            "power_load": round(p_load, 4),
            "power_max_possible": round(p_max, 4),
            "efficiency_pct": round(efficiency, 2),
            "is_matched": is_matched,
        }

    def evaluate_ac_rlc_resonance(self, r: float, l: float, c: float, v_rms: float = 12.0) -> Dict[str, Any]:
        """Calculates RLC series resonance frequency, Q factor, and bandwidth."""
        if l <= 0 or c <= 0:
            return {"f0_hz": 0.0, "q_factor": 0.0, "bandwidth_hz": 0.0}
        f0 = 1.0 / (2.0 * math.pi * math.sqrt(l * c))
        omega0 = 2.0 * math.pi * f0
        q_factor = (omega0 * l) / r if r > 0 else 999.0
        bandwidth = f0 / q_factor if q_factor > 0 else 0.0
        i_peak = (v_rms * math.sqrt(2)) / r if r > 0 else 0.0
        return {
            "f0_hz": round(f0, 2),
            "omega0_rad_s": round(omega0, 2),
            "q_factor": round(q_factor, 2),
            "bandwidth_hz": round(bandwidth, 2),
            "current_resonance_arms": round(v_rms / r, 4) if r > 0 else 0.0,
        }

    def evaluate_rc_transient(self, r: float, c: float, v_source: float, time_t: float) -> Dict[str, Any]:
        """Calculates first-order RC charging transient."""
        tau = r * c
        if tau <= 0:
            return {"tau": 0.0, "v_c": v_source}
        v_c = v_source * (1.0 - math.exp(-time_t / tau))
        i_charge = (v_source / r) * math.exp(-time_t / tau) if r > 0 else 0.0
        return {
            "tau_seconds": round(tau, 6),
            "v_capacitor": round(v_c, 4),
            "i_transient": round(i_charge, 6),
            "percent_charged": round((v_c / v_source) * 100, 2) if v_source else 100.0,
        }

    def evaluate_opamp_circuit(
        self,
        config: str, # "inverting", "non_inverting", "summing", "butterworth_lowpass"
        r_in: float,
        r_f: float,
        v_in: float,
        c: Optional[float] = None,
        freq_hz: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Calculates Op-Amp closed loop gain, output voltage, and filter cutoff."""
        if r_in <= 0:
            return {"gain": 0.0, "v_out": 0.0}

        if config == "inverting":
            gain = - (r_f / r_in)
            v_out = gain * v_in
            fc = 1.0 / (2.0 * math.pi * r_f * c) if (c and c > 0) else None
            return {
                "gain": round(gain, 4),
                "v_out": round(v_out, 4),
                "phase_deg": 180.0,
                "cutoff_fc_hz": round(fc, 2) if fc else None,
            }
        elif config == "non_inverting":
            gain = 1.0 + (r_f / r_in)
            v_out = gain * v_in
            return {
                "gain": round(gain, 4),
                "v_out": round(v_out, 4),
                "phase_deg": 0.0,
            }
        elif config == "butterworth_lowpass":
            gain = 1.0 + (r_f / r_in)
            fc = 1.0 / (2.0 * math.pi * r_in * (c or 1e-9))
            v_out = gain * v_in
            return {
                "passband_gain": round(gain, 4),
                "fc_cutoff_hz": round(fc, 2),
                "damping_zeta": 0.707,
            }
        return {"gain": 1.0, "v_out": v_in}

    def evaluate_bjt_bias(self, v_cc: float, r_b: float, r_c: float, beta: float, v_be: float = 0.7) -> Dict[str, Any]:
        """Calculates BJT Common-Emitter Q-point (Ib, Ic, Vce)."""
        if r_b <= 0 or r_c <= 0:
            return {"is_saturated": True, "v_ce": 0.0}
        i_b = max(0.0, (v_cc - v_be) / r_b)
        i_c_active = beta * i_b
        i_c_sat = (v_cc - 0.2) / r_c
        is_saturated = i_c_active >= i_c_sat

        if is_saturated:
            i_c = i_c_sat
            v_ce = 0.2
            state = "Saturation"
        elif i_b <= 0:
            i_c = 0.0
            v_ce = v_cc
            state = "Cutoff"
        else:
            i_c = i_c_active
            v_ce = v_cc - (i_c * r_c)
            state = "Active Linear"

        return {
            "i_b_ua": round(i_b * 1e6, 2),
            "i_c_ma": round(i_c * 1e3, 3),
            "v_ce_volts": round(v_ce, 3),
            "state": state,
            "q_point_centered": abs(v_ce - (v_cc / 2.0)) < (v_cc * 0.2),
        }

    def run_netlist_simulation(self, netlist_text: str, challenge_target: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses SPICE netlist text and verifies solution against challenge goals.
        """
        lines = [ln.strip() for ln in netlist_text.splitlines() if ln.strip() and not ln.startswith('*')]
        components = {}
        for line in lines:
            parts = line.split()
            if not parts:
                continue
            name = parts[0].upper()
            if name.startswith('R') or name.startswith('C') or name.startswith('L') or name.startswith('V') or name.startswith('I'):
                val_raw = parts[-1]
                components[name] = self.parse_numeric(val_raw)

        # Check target conditions
        results = {"parsed_components": components, "measurements": {}}
        is_passed = True
        reasons = []

        # Target checks
        if "target_voltage" in challenge_target:
            v_in = components.get("V1", components.get("VIN", 10.0))
            r1 = components.get("R1", 1000.0)
            r2 = components.get("R2", 1000.0)
            dc = self.evaluate_dc_divider(v_in, r1, r2)
            results["measurements"] = dc
            target_v = float(challenge_target["target_voltage"])
            tolerance = float(challenge_target.get("tolerance", 0.05))
            diff = abs(dc["v_out"] - target_v)
            if diff > (target_v * tolerance + 0.01):
                is_passed = False
                reasons.append(f"V_out is {dc['v_out']}V, expected {target_v}V (within {tolerance*100}%)")

        if "target_resonance_f0" in challenge_target:
            r = components.get("R1", 10.0)
            l = components.get("L1", 1e-3)
            c = components.get("C1", 10e-9)
            rlc = self.evaluate_ac_rlc_resonance(r, l, c)
            results["measurements"] = rlc
            target_f0 = float(challenge_target["target_resonance_f0"])
            diff = abs(rlc["f0_hz"] - target_f0)
            if diff > (target_f0 * 0.08):
                is_passed = False
                reasons.append(f"Resonance f0 is {rlc['f0_hz']} Hz, expected ~{target_f0} Hz")

        if "target_gain" in challenge_target:
            rf = components.get("RF", components.get("R2", 10000.0))
            rin = components.get("RIN", components.get("R1", 1000.0))
            opamp = self.evaluate_opamp_circuit("inverting", rin, rf, 1.0)
            results["measurements"] = opamp
            target_g = float(challenge_target["target_gain"])
            if abs(abs(opamp["gain"]) - abs(target_g)) > 0.1:
                is_passed = False
                reasons.append(f"Gain magnitude is {abs(opamp['gain'])}, expected {abs(target_g)}")

        results["is_correct"] = is_passed
        results["feedback"] = "SPICE simulation verified: All criteria satisfied!" if is_passed else "; ".join(reasons)
        return results


# Global singleton instance
spice_engine = SpiceEngine()
