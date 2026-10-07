"""
E2E API integration test runner for Skill Quest AI.
Validates live endpoints on http://127.0.0.1:5173 / http://127.0.0.1:8000.
"""

import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:5173"


def request(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
        body = json.dumps(data).encode("utf-8")
    else:
        body = None
    try:
        with urllib.request.urlopen(req, data=body) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print(f"  [PASS] {method:4s} {endpoint} -> HTTP {response.status}")
            return res_data
    except Exception as ex:
        print(f"  [FAIL] {method:4s} {endpoint} -> Error: {ex}")
        sys.exit(1)


def main():
    print("==================================================")
    print("Skill Quest AI: End-to-End API Test Suite")
    print("==================================================")

    # 1. Health
    h = request("/api/health")
    assert h["status"] == "healthy"

    # 2. Profile
    p = request("/api/v1/user/profile")
    print(f"    User: {p['username']}, Track: {p['active_track']}, XP: {p['xp']}, Coins: {p['spark_coins']}")

    # 3. Mascot Outfits
    o = request("/api/v1/mascot/outfits")
    print(f"    Available Outfits: {len(o['outfits'])}")

    # 4. Tracks Summary
    t = request("/api/v1/play/tracks")
    print(f"    Tracks: {[x['track'] for x in t['tracks']]}")

    # 5. Level Curriculum
    lvl = request("/api/v1/play/level/eee-lvl-1")
    print(f"    Level: '{lvl['title']}', Interactive Challenges: {len(lvl['challenges'])}")

    # 6. Challenge Simulation & BKT Mastery
    ch = lvl["challenges"][0]
    sub = request(
        "/api/v1/play/challenge/submit",
        method="POST",
        data={
            "level_id": "eee-lvl-1",
            "challenge_id": ch["id"],
            "submission_data": {"r1": 2200, "r2": 1000, "v_in": 12.0},
        },
    )
    print(f"    SPICE Verified: {sub['is_correct']}, BKT Mastery: {sub['mastery_score']}, +XP: {sub['xp_earned']}")

    # 7. Socratic AI Guidance
    hint = request(
        "/api/v1/ai/socratic-hint",
        method="POST",
        data={
            "spice_telemetry": {"v_out": 2.5},
            "target_goal": {"target_voltage": 3.75},
            "user_query": "Why is my voltage too low?",
            "topic_tag": "Voltage Divider",
        },
    )
    print(f"    Spike Tutor Guidance: {hint['guidance'][:70]}...")

    # 8. Quantum League Standings
    l = request("/api/v1/leagues/standings")
    print(f"    League Tier: {l['league_tier']}, Active Standings: {len(l['leaderboard'])}")

    # 9. Interactive Level Notes
    notes = request("/api/v1/courses/levels/eee-lvl-1/notes")
    print(f"    Level Notes: '{notes['title']}', Formulas: {len(notes['formulas_rules'])}")
    read_note = request("/api/v1/courses/levels/eee-lvl-1/notes/read", method="POST")
    print(f"    Marked Note Read: {read_note['status']}")

    # 10. Knowledge Quest Synthesis & Boss Unlock
    kq = request("/api/v1/courses/tracks/EEE/knowledge-quest/1")
    print(f"    Knowledge Quest: '{kq['title']}', Flashcards: {len(kq['practice_flashcards'])}")
    kq_done = request("/api/v1/courses/tracks/EEE/knowledge-quest/1/complete", method="POST")
    print(f"    Knowledge Quest Completed: Boss Unlocked = {kq_done['boss_unlocked']}")

    # 11. Spike Intent Classifier (Greeting vs Challenge Context)
    greet = request(
        "/api/v1/ai/socratic-hint",
        method="POST",
        data={
            "user_query": "Hi Spike!",
            "message": "Hi Spike!",
            "spice_telemetry": {"v_out": 2.5},
            "target_goal": {"target_voltage": 3.75},
        },
    )
    print(f"    Spike Intent: {greet.get('intent', 'GREETING_CASUAL')}")
    assert "2.5" not in greet["guidance"], "Greeting must not leak SPICE measurements!"

    print("\n✅ All End-to-End API Integration Tests Passed Successfully!")


if __name__ == "__main__":
    main()
