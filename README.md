# Skill Quest AI 🦏⚡

A full-stack, gamified engineering learning platform combining **70% game mechanics** (Duolingo-inspired winding progression map, Yu-kai Chou Octalysis, Spike the Engineering Rhino mascot, weekly Quantum Leagues, and daily streaks) with **30% rigorous educational engineering science** (interactive SPICE circuit simulation, Bayesian Knowledge Tracing [BKT] cognitive student modeling, and zero-hallucination Socratic AI tutoring).

---

## 🌟 Architecture & Features

### 1. Curricular Blueprint (90 Production Levels across 3 Disciplines)
- **Electrical & Electronics Engineering (EEE Track):** DC circuits, Ohm's law, KCL/KVL, Thévenin/Norton matching, AC phasors, RLC resonance, power factor correction, transients, and microgrid Boss missions at Levels 10, 20, and 30.
- **Computer Science Engineering (CSE Track):** Memory layout, pointers, binary search trees (BST), graph algorithms (Dijkstra/BFS/DFS), relational schemas, SQL indexing, and datacenter crash Boss missions.
- **Electronics & Communication Engineering (ECE Track):** Semiconductors, BJT Q-point biasing, small-signal models, Fourier analysis, Nyquist sampling, Smith chart matching, QAM, and deep-space telemetry Boss missions.

### 2. Deterministic Engineering Simulation Engines
- **SPICE Netlist & Circuit Verifier:** High-fidelity solver evaluating DC operating points, AC frequency response, and active Op-Amp gains before LLM feedback.
- **Code Sandbox Engine:** Safe, sandboxed Python environment executing student algorithms against unit test assertions.
- **Digital Logic & Truth Table Verifier:** Validates Boolean minimization, gate logic, and sequential flip-flops.

### 3. Spike the Engineering Rhino Mascot
- Canonical 2D vector character model with reactive states (`excited`, `thinking`, `socratic`, `celebrating`, `shocked`).
- Modular wardrobe catalog with 8 outfits:
  1. `CSE_HACKER` (Purple Hoodie & Neon Terminal Glasses)
  2. `ECE_TECH` (Hardware Tech Vest & ESD Wristband)
  3. `EEE_HIGH_VOLTAGE` (High-Voltage Hardhat & Arc Boots)
  4. `TAMIL_TRADITIONAL` (Tamil Veshti & Gold Border Shattai)
  5. `KIMONO_MASTER` (Indigo Samurai Kimono)
  6. `WESTERN_COWBOY` (Ranger Stetson & Leather Vest)
  7. `QUANTUM_CROWN` (Quantum Plasma Crown & Cape)
  8. `MECHA_BOSS_SLAYER` (Titanium Exoskeleton Armor)

### 4. Bayesian Knowledge Tracing (BKT) Engine
- Probabilistic cognitive mastery tracking with transition, guess, and slip modeling ($P(L_0) = 0.30, P(T) = 0.15, P(G) = 0.20, P(S) = 0.10$).
- Exponential skill decay modeling $\text{MasteryScore}(t) = P(L_t) \cdot e^{-\lambda \Delta t}$.
- Visual red pulsing decay alert rings on the learning map when $\text{MasteryScore}(t) < 0.60$.

### 5. Strict Light-First UI Design System
- Canvas background `#FAFAFC`, pure white cards `#FFFFFF`, borders `#E5E7EB`.
- Brand Violet primary `#7C3AED` with soft accent `#A78BFA` and container `#F3EEFF`.
- Track accents: EEE `#F97316`, CSE `#A855F7`, ECE `#F59E0B`.
- 3D tactile buttons (`box-shadow: 0 4px 0 #...`) with responsive active press offsets.

---

## 🚀 Running the Stack

### Backend Service (FastAPI)
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m app.main  # or uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Web Client (React 18 + Vite)
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```
Access the application at `http://localhost:5173`.
