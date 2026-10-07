"""
Curriculum Seed Generator for Skill Quest AI
Seeds 90 complete levels (30 EEE, 30 CSE, 30 ECE) with 8-10 interactive challenges each,
narrative Boss missions, mascot wardrobe catalog, and demo learner profile.
"""

import asyncio
from datetime import datetime, timezone
from sqlalchemy import select
from .database import AsyncSessionLocal, init_db
from .models import (
    Level, Challenge, MascotOutfit, Profile, UserMascotInventory,
    UserCourseProgress, BKTTopicMastery, LeagueStanding,
    LevelNote, KnowledgeQuest
)

# Canonical 8 Rhino Outfits
OUTFIT_DEFINITIONS = [
    {
        "code": "CSE_HACKER",
        "name": "CSE Hacker Hoodie",
        "description": "Dark violet hoodie with neon terminal glasses and hotkeys pin.",
        "category": "TRACK",
        "image_layer_url": "outfit-cse-hacker",
        "price_coins": 0,
        "is_default": False,
    },
    {
        "code": "ECE_TECH",
        "name": "ECE Hardware Tech Vest",
        "description": "ESD antistatic safety wristband with multimeter utility vest.",
        "category": "TRACK",
        "image_layer_url": "outfit-ece-tech",
        "price_coins": 0,
        "is_default": False,
    },
    {
        "code": "EEE_HIGH_VOLTAGE",
        "name": "EEE High-Voltage Hardhat",
        "description": "Insulated hardhat with lightning visor and arc-resistant boots.",
        "category": "TRACK",
        "image_layer_url": "outfit-eee-hv",
        "price_coins": 0,
        "is_default": True,
    },
    {
        "code": "TAMIL_TRADITIONAL",
        "name": "Tamil Veshti & Shattai",
        "description": "Traditional South Indian silk shirt with pristine gold-bordered Veshti.",
        "category": "CULTURAL",
        "image_layer_url": "outfit-tamil-veshti",
        "price_coins": 150,
        "is_default": False,
    },
    {
        "code": "KIMONO_MASTER",
        "name": "Indigo Samurai Kimono",
        "description": "Traditional Japanese haori with crest and katana engineering ruler.",
        "category": "CULTURAL",
        "image_layer_url": "outfit-kimono-master",
        "price_coins": 150,
        "is_default": False,
    },
    {
        "code": "WESTERN_COWBOY",
        "name": "Grid Ranger Cowboy Gear",
        "description": "Tan stetson hat, leather vest, and brass galvanometer spurs.",
        "category": "CULTURAL",
        "image_layer_url": "outfit-western-cowboy",
        "price_coins": 150,
        "is_default": False,
    },
    {
        "code": "QUANTUM_CROWN",
        "name": "Quantum League Crown & Cape",
        "description": "Radiant plasma crown awarded to Quantum League tier leaders.",
        "category": "ACHIEVEMENT",
        "image_layer_url": "outfit-quantum-crown",
        "price_coins": 500,
        "unlock_required_badge": "Quantum League Champion",
        "is_default": False,
    },
    {
        "code": "MECHA_BOSS_SLAYER",
        "name": "Boss Slayer Mecha-Armor",
        "description": "Heavy titanium exoskeleton forged after clearing Level 30 Boss.",
        "category": "BOSS",
        "image_layer_url": "outfit-mecha-boss",
        "price_coins": 600,
        "unlock_required_badge": "Substation Boss Slayer",
        "is_default": False,
    },
]

# Track Metadata & Curricula
TRACK_METADATA = {
    "EEE": {
        "topics": [
            ("Ohm's Law & Power", "Charge, Voltage, Current, Ohm's Law $V = I \\cdot R$ and dissipation $P = I^2 R$."),
            ("KCL & KVL Laws", "Kirchhoff's Current Law $\\sum I = 0$ and Kirchhoff's Voltage Law $\\sum V = 0$."),
            ("Nodal Analysis", "Essential node formulation with conductance matrices."),
            ("Mesh Current Analysis", "Planar loop formulation and circulating mesh currents."),
            ("Thévenin Equivalent", "Open-circuit voltage $V_{Th}$ and look-back resistance $R_{Th}$."),
            ("Norton & Max Power", "Norton current source and matching $R_L = R_{Th}$ for maximum efficiency."),
            ("Capacitors & Inductors", "Energy storage $E = \\frac{1}{2} C V^2$ and $E = \\frac{1}{2} L I^2$."),
            ("First-Order RC Transients", "Charging time constant $\\tau = RC$ and voltage exponential decay."),
            ("First-Order RL Transients", "Inductive time constant $\\tau = L/R$ and current settling."),
            ("BOSS: Substation Blackout", "Storm knocked out main transformer! Balance nodal voltages, match Thévenin impedance, restore grid!"),
            ("AC Sinusoids & RMS", "Sinusoidal waveforms, peak vs RMS values ($V_{rms} = V_p / \\sqrt{2}$)."),
            ("Phasor Representation", "Transforming time domain signals to complex phasors $\\mathbf{V} = V_{rms} \\angle \\phi$."),
            ("Complex Impedance", "Resistive, inductive ($j\\omega L$), and capacitive ($-j / \\omega C$) branch calculations."),
            ("Series RLC Resonance", "Resonant frequency $f_0 = \\frac{1}{2\\pi\\sqrt{LC}}$ and zero reactive phase."),
            ("Parallel RLC & Q-Factor", "High Q-factor tank circuits and bandwidth $BW = f_0 / Q$."),
            ("AC Power Triangles", "Real power $P$ (W), Reactive power $Q$ (VAR), Apparent power $S$ (VA)."),
            ("Power Factor Correction", "Shunt capacitor banks tuning $\\cos\\phi \\to 0.95$ lagging."),
            ("Three-Phase Systems", "Balanced wye-delta transformations and line vs phase voltages ($V_L = \\sqrt{3} V_{ph}$)."),
            ("Second-Order Transient Response", "Underdamped, critically damped, and overdamped RLC oscillations."),
            ("BOSS: Satellite Power Grid", "Solar panels in orbit suffered eclipse transient! Damp LC ringing and stabilize AC bus!"),
            ("Boolean Algebra & Gates", "Logic gates, De Morgan's theorems, and canonical SOP forms."),
            ("K-Map Minimization", "3-variable and 4-variable Karnaugh mapping for gate reduction."),
            ("Combinational Decoders", "Binary decoders, multiplexers (MUX), and priority encoders."),
            ("Sequential Flip-Flops", "SR, JK, D, and T flip-flop state transitions and clock triggering."),
            ("Synchronous Counters", "Modulo-N counters, ripple counters, and state machine graphs."),
            ("Ideal Op-Amp Basics", "Virtual ground concept and inverting vs non-inverting gain formulas."),
            ("Summing & Differential Amps", "Analog weighted adders, instrumentation amplifiers, and CMRR."),
            ("Active Butterworth Filters", "Second-order active low-pass and high-pass Sallen-Key topologies."),
            ("PID Controller Feedback", "Proportional, integral, and derivative tuning ($K_p, K_i, K_d$) for steady-state error."),
            ("BOSS: Smart Grid Command", "Microgrid frequency oscillating! Tune active Op-Amp filters and stabilize PID feedback!"),
        ]
    },
    "CSE": {
        "topics": [
            ("Memory Layout & Pointers", "Stack vs Heap, pointer arithmetic, memory addresses, and dereferencing."),
            ("Primitive Types & Bitwise", "Twos complement representation, bitwise masking, shifts, and flags."),
            ("Control Flow & Recursion", "Branching, loop invariants, base cases, and call stack frames."),
            ("OOP & Class Abstraction", "Encapsulation, inheritance, polymorphism, and memory vtables."),
            ("Dynamic Arrays & Vectors", "Amortized $O(1)$ resizing, capacity doubling, and contiguous cache locality."),
            ("String Algorithms & ASCII", "Sliding window, string parsing, and palindromic search."),
            ("Big-O Complexity Analysis", "Time and space asymptotic bounds ($O(1), O(n), O(n \\log n), O(n^2)$)."),
            ("Linked Lists Implementation", "Singly and doubly linked lists, node insertion, and pointer cycle detection."),
            ("Stacks & Queues", "LIFO and FIFO data structures, monotonic stacks, and circular buffers."),
            ("BOSS: Server Memory Overflow", "Runaway process leaking memory! Debug leaks, fix dangling pointers, rebalance BST!"),
            ("Sorting: Quick & Merge Sort", "Divide-and-conquer paradigms, pivot partitioning, and stable merge."),
            ("Binary Search & Lower Bound", "Logarithmic search on monotonic spaces and boundary conditions."),
            ("Binary Search Trees (BST)", "In-order traversal, BST balance properties, and node deletion."),
            ("Graph Representations", "Adjacency matrix vs adjacency list and graph traversal properties."),
            ("Breadth-First Search (BFS)", "Shortest path on unweighted graphs and queue traversal."),
            ("Depth-First Search (DFS)", "Cycle detection, topological sort, and backtracking paths."),
            ("Dijkstras Shortest Path", "Priority queue relaxation on non-negative weighted graphs."),
            ("Minimum Spanning Trees", "Prims and Kruskals greedy algorithms with Disjoint-Set Union (DSU)."),
            ("Dynamic Programming 1D", "Memoization, tabulation, Fibonacci, and house robber recurrence."),
            ("BOSS: Drone Routing Gridlock", "Drone fleet lost connectivity! Resolve thread deadlocks, calculate Dijkstra shortest paths!"),
            ("Dynamic Programming 2D", "0/1 Knapsack, Longest Common Subsequence (LCS), and grid transitions."),
            ("Operating Systems: Semaphores", "Mutex locks, semaphores, critical sections, and race condition avoidance."),
            ("TCP/IP & Socket Programming", "Three-way handshake, packet windowing, and socket streams."),
            ("Relational DB: Schema & Keys", "Primary keys, foreign keys, normalization (1NF, 2NF, 3NF)."),
            ("Complex SQL Joins & Grouping", "Inner, left, outer joins, aggregate functions, and GROUP BY indexes."),
            ("B-Tree vs Hash Indexing", "Disk page reads, composite index selectivity, and query execution plans."),
            ("REST APIs & Idempotency", "HTTP verbs, status codes, payload validation, and idempotency keys."),
            ("Microservice Circuit Breakers", "Timeout thresholds, sliding failure rate windows, and graceful fallback."),
            ("Neural Network Forward Pass", "Dot products, matrix multiplication, activation functions (ReLU, Sigmoid)."),
            ("BOSS: Datacenter Outage", "Deadlock crashed e-commerce platform! Re-index slow queries, tune circuit breakers!"),
        ]
    },
    "ECE": {
        "topics": [
            ("Semiconductor Bandgaps", "Intrinsic vs extrinsic carriers, doping concentrations, and Fermi level."),
            ("Drift & Diffusion Currents", "Electric field drift, carrier concentration gradient diffusion, Einstein relation."),
            ("PN Junction Diode I-V", "Shockley equation $I = I_s (e^{V / V_t} - 1)$ and depletion barrier capacitance."),
            ("Zener Diode Regulators", "Avalanche vs Zener breakdown and stable voltage shunt regulation."),
            ("BJT Operating Modes", "Cutoff, active linear, and saturation states with Ebers-Moll equations."),
            ("Common-Emitter Biasing", "Collector current $I_c = \\beta I_b$ and DC load line Q-point stabilization."),
            ("Small-Signal BJT Amplifiers", "Hybrid-pi model, input impedance, transconductance $g_m$, and voltage gain."),
            ("MOSFET Device Physics", "Threshold voltage $V_{th}$, pinch-off, linear and saturation region equations."),
            ("CMOS Inverter Switching", "Pull-up PMOS and pull-down NMOS, voltage transfer characteristics (VTC)."),
            ("BOSS: 5G Signal Receiver Fail", "Thermal noise destroying amplifier bias! Calculate BJT Q-point, restore low-noise gain!"),
            ("Continuous-Time Signals", "Dirac delta, unit step, impulse response $h(t)$, and system causality."),
            ("Linear Time-Invariant (LTI)", "Convolution integral $y(t) = x(t) * h(t)$ and stability criteria."),
            ("Continuous Fourier Transform", "Frequency spectrum $X(j\\omega)$, transform pairs, and bandwidth filtering."),
            ("Nyquist Sampling Theorem", "Sampling rate $f_s \\ge 2 f_{max}$, anti-aliasing filters, and Shannon reconstruction."),
            ("Discrete Fourier Transform", "DFT formulas and Fast Fourier Transform (FFT) $O(N \\log N)$ spectral analysis."),
            ("AM Modulation & Demodulation", "Envelope detection, modulation index $m = A_m / A_c$, and sideband power."),
            ("FM Modulation & Carson Rule", "Frequency deviation $\\Delta f$, modulation index $\\beta$, and transmission bandwidth."),
            ("Phase-Locked Loops (PLL)", "Phase detector, loop filter, VCO tracking, and frequency synthesis."),
            ("Hardware Buses: UART & SPI", "Baud rate framing, SPI master-slave clock polarity (CPOL/CPHA), I2C open-drain."),
            ("BOSS: Vehicle ECU Bus Crash", "High-frequency EMI corrupted CAN bus! Tune PLL carrier, configure FIR filter!"),
            ("Maxwells Equations", "Faradays induction, Amperes law with Maxwells displacement current term."),
            ("Electromagnetic Wave Propagation", "Phase velocity $v_p$, intrinsic impedance $\\eta_0 = 377\\ \\Omega$, skin depth."),
            ("Transmission Line Reflection", "Characteristic impedance $Z_0$, reflection coefficient $\\Gamma = \\frac{Z_L - Z_0}{Z_L + Z_0}$, VSWR."),
            ("Smith Chart Impedance Matching", "Normalized impedance, constant-SWR circles, and single-stub matching."),
            ("Antenna Radiation Patterns", "Half-wave dipole, radiation resistance, beamwidth, and isotropic gain (dBi)."),
            ("CMOS Digital Delay", "Propagation delay $\\tau_{pd}$, fan-out capacitance, and Elmore delay approximation."),
            ("Setup & Hold Time Constraints", "Clock skew, jitter, $t_{cq} + t_{comb} \\le T_{clk} - t_{setup}$ timing margin."),
            ("QAM-16/64 Constellations", "Quadrature amplitude modulation symbols, constellation distance, and Gray coding."),
            ("Bit Error Rate (BER) & Hamming", "AWGN channel $E_b / N_0$, waterfall curve, Hamming (7,4) single-bit correction."),
            ("BOSS: Deep-Space Telemetry", "Deep-space probe signal buried under cosmic noise! Match Smith chart, decode QAM!"),
        ]
    }
}


def generate_challenges_for_level(level_id: str, track: str, level_num: int, topic: str, is_boss: bool):
    """Generates 8-10 rich interactive challenges for each level."""
    challenges = []
    num_challenges = 10 if is_boss else 8

    for c_idx in range(1, num_challenges + 1):
        c_uuid = f"{level_id}-c{c_idx}"
        diff = round(0.2 + (level_num / 30.0) * 0.7 + (c_idx * 0.02), 2)

        if track == "EEE":
            if level_num <= 10:
                # DC Circuit / Divider / Thévenin challenges
                target_v = round(3.3 + (c_idx * 0.5), 2)
                r2_val = 1000 * c_idx
                initial_netlist = f"* Level {level_num} Challenge {c_idx}\nV1 1 0 12V\nR1 1 2 10k\nR2 2 0 10k\n.op\n"
                prompt = (
                    f"Design a voltage divider network to output precisely {target_v} V from a 12 V DC supply. "
                    f"Tune resistor R1 while keeping R2 = {r2_val} Ω."
                )
                initial_state = {"netlist": initial_netlist, "v_in": 12.0, "r1": 10000, "r2": r2_val}
                target_state = {"target_voltage": target_v, "tolerance": 0.05}
                c_type = "SPICE_CIRCUIT"
            elif level_num <= 20:
                # AC RLC resonance
                target_f0 = round(1000.0 * c_idx, 1)
                initial_netlist = f"* AC Resonance\nVIN 1 0 AC 10V\nR1 1 2 50\nL1 2 3 10mH\nC1 3 0 100nF\n.ac dec 10 100 100k\n"
                prompt = f"Tune capacitor C1 and inductor L1 so the RLC series tank resonates at f0 = {target_f0} Hz."
                initial_state = {"netlist": initial_netlist, "f_target": target_f0, "r": 50, "l": "10mH", "c": "100nF"}
                target_state = {"target_resonance_f0": target_f0}
                c_type = "PHASOR_ALIGN"
            else:
                # Op-Amp / Logic
                gain = -round(2.0 + c_idx * 0.5, 1)
                prompt = f"Configure the inverting op-amp feedback resistors so the closed-loop voltage gain Av = {gain}."
                initial_state = {"config": "inverting", "rin": 10000, "rf": 20000}
                target_state = {"target_gain": gain}
                c_type = "SLIDER_TUNING"

        elif track == "CSE":
            c_type = "CODE_DEBUG"
            if level_num <= 10:
                # Data structures / pointer logic
                prompt = (
                    f"Implement or fix the algorithm to reverse an array in-place without auxiliary memory. "
                    f"Test case #{c_idx}: Verify with list of size {c_idx * 5}."
                )
                initial_state = {
                    "code": "def solve(arr):\n    # TODO: Reverse arr in place\n    arr.reverse()\n    return arr\n",
                    "language": "python"
                }
                target_state = {
                    "assertions": [
                        "solve([1, 2, 3, 4, 5]) == [5, 4, 3, 2, 1]",
                        "solve([]) == []",
                        "solve([42]) == [42]"
                    ]
                }
            elif level_num <= 20:
                prompt = (
                    f"Implement Dijkstra node relaxation or binary search lower bound. "
                    f"Ensure time complexity stays bounded by O(log N) or O(E log V)."
                )
                initial_state = {
                    "code": "def binary_search(nums, target):\n    # Return index of target or -1\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n",
                    "language": "python"
                }
                target_state = {
                    "assertions": [
                        "binary_search([2, 5, 8, 12, 16, 23, 38], 16) == 4",
                        "binary_search([1, 3, 5], 2) == -1"
                    ]
                }
            else:
                prompt = f"Optimize relational join logic or microservice sliding circuit breaker window."
                initial_state = {
                    "code": "def circuit_breaker(failure_rate, threshold=0.5):\n    return 'OPEN' if failure_rate >= threshold else 'CLOSED'\n",
                    "language": "python"
                }
                target_state = {
                    "assertions": [
                        "circuit_breaker(0.6) == 'OPEN'",
                        "circuit_breaker(0.2) == 'CLOSED'"
                    ]
                }

        else: # ECE
            if level_num <= 10:
                c_type = "SPICE_CIRCUIT"
                v_ce_target = round(4.0 + (c_idx * 0.4), 2)
                prompt = f"Bias the Common-Emitter BJT amplifier circuit to achieve Q-point V_ce = {v_ce_target} V with V_cc = 12 V."
                initial_state = {"v_cc": 12.0, "rb": 100000, "rc": 1000, "beta": 100}
                target_state = {"target_vce": v_ce_target}
            elif level_num <= 20:
                c_type = "SLIDER_TUNING"
                nyquist_fs = round(2.0 * (100.0 * c_idx), 1)
                prompt = f"Set sampling frequency fs to satisfy the Nyquist criterion without aliasing for signal band {100.0 * c_idx} Hz."
                initial_state = {"signal_freq": 100.0 * c_idx, "sampling_freq": 100.0 * c_idx}
                target_state = {"min_sampling_freq": nyquist_fs}
            else:
                c_type = "TRUTH_TABLE"
                prompt = f"Match the impedance or complete the digital constellation parity decoder for QAM-16 carrier demodulation."
                initial_state = {"submitted_table": [{"Y": 0}, {"Y": 1}]}
                target_state = {"expected_table": [{"Y": 0}, {"Y": 1}]}

        hints = [
            f"Review the fundamental formula for {topic}.",
            f"Observe the direction of current flow and boundary constraints.",
            f"Spike tip: Check component ratios before evaluating!",
        ]

        challenges.append({
            "order_index": c_idx,
            "challenge_type": c_type,
            "prompt_text": prompt,
            "initial_state_json": initial_state,
            "target_state_json": target_state,
            "hints_json": hints,
            "difficulty_rating": min(0.95, diff),
        })

    return challenges


async def seed_notes_and_knowledge_quests(session):
    """Seeds LevelNote and KnowledgeQuest tables if not already seeded."""
    # 1. Level Notes
    note_check = await session.execute(select(LevelNote).limit(1))
    if not note_check.scalars().first():
        print("[Skill Quest AI] Seeding Level Notes for curriculum levels...")
        levels_res = await session.execute(select(Level))
        all_levels = levels_res.scalars().all()
        for lvl in all_levels:
            track = lvl.track
            if track == "EEE":
                formulas = [
                    {"label": "Ohm's Law", "latex": "V = I \\times R"},
                    {"label": "Voltage Divider Rule", "latex": "V_{out} = V_{in} \\times \\frac{R_2}{R_1 + R_2}"},
                    {"label": "Joule Heating Power", "latex": "P = V \\times I = I^2 \\times R"}
                ]
                real_world = "Used in smartphone battery management ICs, buck converters, and electric vehicle powertrain regulation."
            elif track == "CSE":
                formulas = [
                    {"label": "Bitwise Left Shift", "latex": "x \\ll k = x \\times 2^k"},
                    {"label": "Asymptotic Runtime", "latex": "T(n) = \\mathcal{O}(n \\log n)"},
                    {"label": "De Morgan's Inversion", "latex": "\\overline{A \\cdot B} = \\overline{A} + \\overline{B}"}
                ]
                real_world = "Underpins modern operating system page tables, cryptographic hashing, and high-frequency network packets."
            else:  # ECE
                formulas = [
                    {"label": "Resonant Frequency", "latex": "f_0 = \\frac{1}{2\\pi\\sqrt{LC}}"},
                    {"label": "Inverting Op-Amp Gain", "latex": "A_v = -\\frac{R_f}{R_{in}}"},
                    {"label": "Nyquist Criterion", "latex": "f_s \\ge 2 \\cdot f_{max}"}
                ]
                real_world = "Directly implemented in 5G RF front-end bandpass filters, smartphone audio codecs, and radar telemetry."

            note = LevelNote(
                level_id=lvl.id,
                title=f"{lvl.title} Primer",
                summary=f"Master key theoretical foundations and circuit relationships for {lvl.title}.",
                key_points=[
                    f"Theoretical model establishing steady-state for {lvl.title}.",
                    "Step-by-step mathematical decomposition of circuit laws.",
                    "Verification against SPICE simulation telemetry before adjusting components."
                ],
                formulas_rules=formulas,
                worked_example={
                    "problem": f"Calculate the required component value to reach nominal target in {lvl.title}.",
                    "step_by_step": "1. Identify circuit or logic boundary constraints.\n2. Apply the fundamental formula.\n3. Verify tolerance bounds against target goal.",
                    "solution": "Nominal equilibrium achieved within ±1.5% margin."
                },
                visual_asset_url=f"/assets/diagrams/{lvl.id}.svg",
                real_world_connection=real_world
            )
            session.add(note)
        await session.commit()

    # 2. Knowledge Quests
    kq_check = await session.execute(select(KnowledgeQuest).limit(1))
    if not kq_check.scalars().first():
        print("[Skill Quest AI] Seeding Knowledge Quests for Modules 1, 2, 3 across tracks...")
        from ..routes.courses import generate_fallback_knowledge_quest
        for track in ["EEE", "CSE", "ECE"]:
            for m_idx in [1, 2, 3]:
                data = generate_fallback_knowledge_quest(track, m_idx)
                kq = KnowledgeQuest(
                    track=data["track"],
                    module_index=data["module_index"],
                    title=data["title"],
                    recap_summary=data["recap_summary"],
                    concept_breakdown=data["concept_breakdown"],
                    key_formulas=data["key_formulas"],
                    practice_flashcards=data["practice_flashcards"],
                    unlocked_after_level_number=data["unlocked_after_level_number"]
                )
                session.add(kq)
        await session.commit()


async def seed_database():
    """Initializes and seeds full 90 levels, challenges, outfits, and starter profile."""
    await init_db()
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(Level).limit(1))
        existing_level = result.scalars().first()
        if existing_level:
            print("[Skill Quest AI] Database already contains curriculum. Ensuring notes and knowledge quests are seeded...")
            await seed_notes_and_knowledge_quests(session)
            return

        print("[Skill Quest AI] Seeding Mascot Wardrobe Outfits...")
        outfit_objs = []
        for o_data in OUTFIT_DEFINITIONS:
            outfit = MascotOutfit(**o_data)
            session.add(outfit)
            outfit_objs.append(outfit)
        await session.flush()

        print("[Skill Quest AI] Seeding 90 Levels and 720+ Challenges across EEE, CSE, ECE tracks...")
        for track, data in TRACK_METADATA.items():
            topics = data["topics"]
            for idx, (title, desc) in enumerate(topics):
                level_num = idx + 1
                module_idx = 1 if level_num <= 10 else (2 if level_num <= 20 else 3)
                is_boss = level_num in [10, 20, 30]
                lvl_id = f"{track.lower()}-lvl-{level_num}"

                boss_brief = desc if is_boss else None
                short_markdown = f"""### {title}
{desc}

**Key Principles:**
- Foundation for modern engineering applications.
- Deterministic simulation verification ensures accurate mathematical ground truth.
- Follow Spike the Rhino's guiding questions to reach equilibrium!
"""

                level = Level(
                    id=lvl_id,
                    track=track,
                    module_index=module_idx,
                    level_number=level_num,
                    title=title,
                    topic_tag=title.split(":")[0].replace("BOSS", "").strip(),
                    learning_objective=desc,
                    prerequisite=f"{track} Level {level_num - 1}" if level_num > 1 else "None (Orientation)",
                    short_lesson_markdown=short_markdown,
                    is_boss_level=is_boss,
                    boss_scenario_brief=boss_brief,
                    xp_reward=250 if is_boss else 100,
                    coin_reward=50 if is_boss else 15,
                )
                session.add(level)

                # Seed challenges for this level
                challenges_data = generate_challenges_for_level(lvl_id, track, level_num, title, is_boss)
                for ch_data in challenges_data:
                    ch = Challenge(
                        level_id=lvl_id,
                        order_index=ch_data["order_index"],
                        challenge_type=ch_data["challenge_type"],
                        prompt_text=ch_data["prompt_text"],
                        initial_state_json=ch_data["initial_state_json"],
                        target_state_json=ch_data["target_state_json"],
                        hints_json=ch_data["hints_json"],
                        difficulty_rating=ch_data["difficulty_rating"],
                    )
                    session.add(ch)

        # Seed Demo Student Profile
        print("[Skill Quest AI] Creating default learner profile and initial inventory...")
        demo_user_id = "00000000-0000-0000-0000-000000000001"
        default_outfit = next((o for o in outfit_objs if o.is_default), outfit_objs[0])

        profile = Profile(
            id=demo_user_id,
            email="student@skillquest.ai",
            username="QuantumRhino",
            active_track="EEE",
            xp=320,
            spark_coins=180,
            streak_days=4,
            hearts=5,
            max_hearts=5,
            equipped_outfit_id=default_outfit.id,
            current_league="Bronze",
        )
        session.add(profile)
        await session.flush()

        # Unlock default outfit in inventory
        inv = UserMascotInventory(user_id=profile.id, outfit_id=default_outfit.id)
        session.add(inv)

        # Unlock initial track progress
        for trk in ["EEE", "CSE", "ECE"]:
            prog = UserCourseProgress(
                user_id=profile.id,
                track=trk,
                completed_level_ids=[f"{trk.lower()}-lvl-1"],
                stars_earned_json={f"{trk.lower()}-lvl-1": 3},
                unlocked_level_number=2,
            )
            session.add(prog)

            # Initial BKT mastery record
            mastery = BKTTopicMastery(
                user_id=profile.id,
                track=trk,
                topic_tag="Ohm's Law & Power" if trk == "EEE" else ("Memory Layout" if trk == "CSE" else "Semiconductor Bandgaps"),
                p_mastery=0.72,
            )
            session.add(mastery)

        # League Standings
        league = LeagueStanding(
            user_id=profile.id,
            username=profile.username,
            league_tier="Bronze",
            weekly_xp=320,
            rank=3,
        )
        session.add(league)

        await session.commit()
        await seed_notes_and_knowledge_quests(session)
        print("[Skill Quest AI] Database seeded successfully! 90 Levels, 720+ Challenges, Outfits, & Profile ready.")


if __name__ == "__main__":
    asyncio.run(seed_database())
