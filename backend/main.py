from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import json
from datetime import date, datetime
import os

app = FastAPI(title="Obsidian Lens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "obsidian.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT 'Aarchi',
            weight REAL DEFAULT 72,
            height REAL DEFAULT 175,
            age INTEGER DEFAULT 24,
            goal TEXT DEFAULT 'gain',
            streak INTEGER DEFAULT 0,
            last_workout_date TEXT
        );

        CREATE TABLE IF NOT EXISTS workout_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            muscle_group TEXT NOT NULL,
            date TEXT NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS exercises (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            name TEXT NOT NULL,
            category TEXT,
            muscle_group TEXT,
            sets_data TEXT,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY(session_id) REFERENCES workout_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS water_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            date TEXT NOT NULL,
            amount_ml INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS nutrient_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            date TEXT NOT NULL,
            food_name TEXT NOT NULL,
            calories INTEGER DEFAULT 0,
            protein REAL DEFAULT 0,
            carbs REAL DEFAULT 0,
            fats REAL DEFAULT 0,
            fiber REAL DEFAULT 0,
            macro_category TEXT DEFAULT 'mixed',
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS weight_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            date TEXT NOT NULL,
            weight REAL NOT NULL
        );
    """)

    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        c.execute("INSERT INTO users (name, weight, height, age, goal, streak) VALUES (?,?,?,?,?,?)",
                  ("Aarchi", 72, 175, 24, "gain", 12))

    default_weights = {
        "Mon": [2.2, 2.4, 2.1, 2.3, 2.5, 2.0, 2.6],
        "water": [2200, 1800, 2400, 600, 0, 0, 0]
    }

    conn.commit()
    conn.close()

init_db()

WORKOUT_SPLIT = {
    0: "Rest",
    1: "Chest",
    2: "Back",
    3: "Shoulder",
    4: "Arms",
    5: "Legs",
    6: "Core"
}

EXERCISE_LIBRARY = {
    "Chest": [
        {"name": "Bench Press", "category": "COMPOUND / CHEST", "sets": [{"set": 1, "lbs": 135, "reps": 12}, {"set": 2, "lbs": 185, "reps": 8}]},
        {"name": "Incline DB Fly", "category": "ISOLATION / UPPER CHEST", "sets": [{"set": 1, "lbs": 45, "reps": 15}]},
        {"name": "Cable Crossover", "category": "ISOLATION / CHEST", "sets": [{"set": 1, "lbs": 40, "reps": 15}]},
        {"name": "Push-Ups", "category": "COMPOUND / CHEST", "sets": [{"set": 1, "lbs": 0, "reps": 20}]},
    ],
    "Back": [
        {"name": "Deadlift", "category": "COMPOUND / BACK", "sets": [{"set": 1, "lbs": 225, "reps": 5}]},
        {"name": "Pull-Ups", "category": "COMPOUND / BACK", "sets": [{"set": 1, "lbs": 0, "reps": 10}]},
        {"name": "Bent-Over Row", "category": "COMPOUND / BACK", "sets": [{"set": 1, "lbs": 135, "reps": 8}]},
        {"name": "Lat Pulldown", "category": "ISOLATION / BACK", "sets": [{"set": 1, "lbs": 120, "reps": 12}]},
    ],
    "Shoulder": [
        {"name": "Overhead Press", "category": "COMPOUND / SHOULDER", "sets": [{"set": 1, "lbs": 95, "reps": 8}]},
        {"name": "Lateral Raises", "category": "ISOLATION / SHOULDER", "sets": [{"set": 1, "lbs": 25, "reps": 15}]},
        {"name": "Front Raises", "category": "ISOLATION / SHOULDER", "sets": [{"set": 1, "lbs": 20, "reps": 12}]},
        {"name": "Arnold Press", "category": "COMPOUND / SHOULDER", "sets": [{"set": 1, "lbs": 35, "reps": 10}]},
    ],
    "Arms": [
        {"name": "Barbell Curl", "category": "ISOLATION / BICEPS", "sets": [{"set": 1, "lbs": 65, "reps": 12}]},
        {"name": "Tricep Pushdown", "category": "ISOLATION / TRICEPS", "sets": [{"set": 1, "lbs": 50, "reps": 15}]},
        {"name": "Hammer Curls", "category": "ISOLATION / BICEPS", "sets": [{"set": 1, "lbs": 30, "reps": 12}]},
        {"name": "Skull Crushers", "category": "ISOLATION / TRICEPS", "sets": [{"set": 1, "lbs": 60, "reps": 10}]},
    ],
    "Legs": [
        {"name": "Back Squat", "category": "COMPOUND / LEGS", "sets": [{"set": 1, "lbs": 185, "reps": 8}]},
        {"name": "Leg Press", "category": "COMPOUND / QUADS", "sets": [{"set": 1, "lbs": 270, "reps": 12}]},
        {"name": "Romanian Deadlift", "category": "COMPOUND / HAMSTRINGS", "sets": [{"set": 1, "lbs": 135, "reps": 10}]},
        {"name": "Leg Extension", "category": "ISOLATION / QUADS", "sets": [{"set": 1, "lbs": 90, "reps": 15}]},
    ],
    "Core": [
        {"name": "Plank", "category": "COMPOUND / CORE", "sets": [{"set": 1, "lbs": 0, "reps": 60}]},
        {"name": "Cable Crunches", "category": "ISOLATION / ABS", "sets": [{"set": 1, "lbs": 50, "reps": 15}]},
        {"name": "Leg Raises", "category": "ISOLATION / LOWER ABS", "sets": [{"set": 1, "lbs": 0, "reps": 20}]},
        {"name": "Russian Twists", "category": "ISOLATION / OBLIQUES", "sets": [{"set": 1, "lbs": 25, "reps": 20}]},
    ]
}

class UserUpdate(BaseModel):
    name: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    age: Optional[int] = None
    goal: Optional[str] = None

class WaterLog(BaseModel):
    amount_ml: int
    date: Optional[str] = None

class NutrientLog(BaseModel):
    food_name: str
    calories: int
    protein: float = 0
    carbs: float = 0
    fats: float = 0
    fiber: float = 0
    macro_category: str = "mixed"
    date: Optional[str] = None

class WorkoutSession(BaseModel):
    muscle_group: str
    date: Optional[str] = None

class ExerciseUpdate(BaseModel):
    name: str
    category: str
    sets_data: list
    completed: bool = False

class SessionComplete(BaseModel):
    duration_seconds: int

class WeightLog(BaseModel):
    weight: float
    date: Optional[str] = None

@app.get("/")
def root():
    return {"status": "Obsidian Lens API running"}

@app.get("/user")
def get_user():
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=1").fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(user)

@app.put("/user")
def update_user(data: UserUpdate):
    conn = get_db()
    fields = {k: v for k, v in data.dict().items() if v is not None}
    if fields:
        sets = ", ".join(f"{k}=?" for k in fields)
        conn.execute(f"UPDATE users SET {sets} WHERE id=1", list(fields.values()))
        conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id=1").fetchone()
    conn.close()
    return dict(user)

@app.get("/today")
def get_today_info():
    today = date.today()
    day_of_week = today.weekday()
    muscle = WORKOUT_SPLIT.get((day_of_week + 1) % 7, "Rest")
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id=1").fetchone()
    water = conn.execute("SELECT SUM(amount_ml) as total FROM water_logs WHERE user_id=1 AND date=?", (str(today),)).fetchone()
    nutrients = conn.execute("SELECT SUM(calories) as cal, SUM(protein) as pr, SUM(carbs) as cb, SUM(fats) as ft, SUM(fiber) as fb FROM nutrient_logs WHERE user_id=1 AND date=?", (str(today),)).fetchone()
    session = conn.execute("SELECT * FROM workout_sessions WHERE user_id=1 AND date=? ORDER BY id DESC LIMIT 1", (str(today),)).fetchone()
    conn.close()
    return {
        "today": str(today),
        "day_name": today.strftime("%A"),
        "muscle_group": muscle,
        "user": dict(user) if user else {},
        "water_ml": water["total"] or 0,
        "water_goal_ml": 3500,
        "calories": nutrients["cal"] or 0,
        "protein": round(nutrients["pr"] or 0, 1),
        "carbs": round(nutrients["cb"] or 0, 1),
        "fats": round(nutrients["ft"] or 0, 1),
        "fiber": round(nutrients["fb"] or 0, 1),
        "session_id": session["id"] if session else None,
        "session_completed": bool(session["completed"]) if session else False,
    }

@app.post("/sessions/start")
def start_session(data: WorkoutSession):
    today = data.date or str(date.today())
    muscle = data.muscle_group
    conn = get_db()
    existing = conn.execute("SELECT id FROM workout_sessions WHERE user_id=1 AND date=? AND muscle_group=?", (today, muscle)).fetchone()
    if existing:
        session_id = existing["id"]
    else:
        c = conn.execute("INSERT INTO workout_sessions (user_id, muscle_group, date) VALUES (1,?,?)", (muscle, today))
        session_id = c.lastrowid
        exercises = EXERCISE_LIBRARY.get(muscle, [])
        for ex in exercises:
            conn.execute("INSERT INTO exercises (session_id, name, category, muscle_group, sets_data, completed) VALUES (?,?,?,?,?,0)",
                         (session_id, ex["name"], ex["category"], muscle, json.dumps(ex["sets"])))
        conn.commit()
    session = conn.execute("SELECT * FROM workout_sessions WHERE id=?", (session_id,)).fetchone()
    exercises = conn.execute("SELECT * FROM exercises WHERE session_id=?", (session_id,)).fetchall()
    exs = []
    for e in exercises:
        d = dict(e)
        d["sets_data"] = json.loads(d["sets_data"])
        exs.append(d)
    conn.close()
    return {"session": dict(session), "exercises": exs}

@app.get("/sessions/{session_id}")
def get_session(session_id: int):
    conn = get_db()
    session = conn.execute("SELECT * FROM workout_sessions WHERE id=?", (session_id,)).fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    exercises = conn.execute("SELECT * FROM exercises WHERE session_id=?", (session_id,)).fetchall()
    exs = []
    for e in exercises:
        d = dict(e)
        d["sets_data"] = json.loads(d["sets_data"])
        exs.append(d)
    conn.close()
    return {"session": dict(session), "exercises": exs}

@app.post("/sessions/{session_id}/exercises")
def add_exercise(session_id: int, data: ExerciseUpdate):
    conn = get_db()
    session = conn.execute("SELECT * FROM workout_sessions WHERE id=?", (session_id,)).fetchone()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    c = conn.execute("INSERT INTO exercises (session_id, name, category, muscle_group, sets_data, completed) VALUES (?,?,?,?,?,0)",
                     (session_id, data.name, data.category, session["muscle_group"], json.dumps(data.sets_data)))
    conn.commit()
    ex = conn.execute("SELECT * FROM exercises WHERE id=?", (c.lastrowid,)).fetchone()
    d = dict(ex)
    d["sets_data"] = json.loads(d["sets_data"])
    conn.close()
    return d

@app.put("/exercises/{exercise_id}")
def update_exercise(exercise_id: int, data: ExerciseUpdate):
    conn = get_db()
    conn.execute("UPDATE exercises SET name=?, category=?, sets_data=?, completed=? WHERE id=?",
                 (data.name, data.category, json.dumps(data.sets_data), int(data.completed), exercise_id))
    conn.commit()
    ex = conn.execute("SELECT * FROM exercises WHERE id=?", (exercise_id,)).fetchone()
    d = dict(ex)
    d["sets_data"] = json.loads(d["sets_data"])
    conn.close()
    return d

@app.post("/sessions/{session_id}/complete")
def complete_session(session_id: int, data: SessionComplete):
    conn = get_db()
    conn.execute("UPDATE workout_sessions SET completed=1, duration_seconds=? WHERE id=?", (data.duration_seconds, session_id))
    today = str(date.today())
    user = conn.execute("SELECT * FROM users WHERE id=1").fetchone()
    last = user["last_workout_date"]
    streak = user["streak"] or 0
    from datetime import timedelta
    yesterday = str(date.today() - timedelta(days=1))
    if last == yesterday:
        streak += 1
    elif last != today:
        streak = 1
    conn.execute("UPDATE users SET streak=?, last_workout_date=? WHERE id=1", (streak, today))
    conn.commit()
    conn.close()
    return {"completed": True, "streak": streak}

@app.post("/water")
def log_water(data: WaterLog):
    today = data.date or str(date.today())
    conn = get_db()
    existing = conn.execute("SELECT id, amount_ml FROM water_logs WHERE user_id=1 AND date=?", (today,)).fetchone()
    if existing:
        new_total = min(existing["amount_ml"] + data.amount_ml, 5000)
        conn.execute("UPDATE water_logs SET amount_ml=? WHERE id=?", (new_total, existing["id"]))
    else:
        conn.execute("INSERT INTO water_logs (user_id, date, amount_ml) VALUES (1,?,?)", (today, data.amount_ml))
    conn.commit()
    total = conn.execute("SELECT amount_ml FROM water_logs WHERE user_id=1 AND date=?", (today,)).fetchone()
    conn.close()
    return {"date": today, "amount_ml": total["amount_ml"]}

@app.get("/water/week")
def get_water_week():
    conn = get_db()
    rows = conn.execute("SELECT date, amount_ml FROM water_logs WHERE user_id=1 ORDER BY date DESC LIMIT 7").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/nutrients")
def log_nutrient(data: NutrientLog):
    today = data.date or str(date.today())
    conn = get_db()
    conn.execute("INSERT INTO nutrient_logs (user_id, date, food_name, calories, protein, carbs, fats, fiber, macro_category) VALUES (1,?,?,?,?,?,?,?,?)",
                 (today, data.food_name, data.calories, data.protein, data.carbs, data.fats, data.fiber, data.macro_category))
    conn.commit()
    logs = conn.execute("SELECT * FROM nutrient_logs WHERE user_id=1 AND date=? ORDER BY created_at DESC", (today,)).fetchall()
    conn.close()
    return [dict(r) for r in logs]

@app.get("/nutrients/today")
def get_nutrients_today():
    today = str(date.today())
    conn = get_db()
    logs = conn.execute("SELECT * FROM nutrient_logs WHERE user_id=1 AND date=? ORDER BY created_at DESC", (today,)).fetchall()
    totals = conn.execute("SELECT SUM(calories) as cal, SUM(protein) as pr, SUM(carbs) as cb, SUM(fats) as ft, SUM(fiber) as fb FROM nutrient_logs WHERE user_id=1 AND date=?", (today,)).fetchone()
    conn.close()
    return {
        "logs": [dict(r) for r in logs],
        "totals": {
            "calories": totals["cal"] or 0,
            "protein": round(totals["pr"] or 0, 1),
            "carbs": round(totals["cb"] or 0, 1),
            "fats": round(totals["ft"] or 0, 1),
            "fiber": round(totals["fb"] or 0, 1),
        }
    }

@app.post("/weight")
def log_weight(data: WeightLog):
    today = data.date or str(date.today())
    conn = get_db()
    conn.execute("INSERT OR REPLACE INTO weight_logs (user_id, date, weight) VALUES (1,?,?)", (today, data.weight))
    conn.execute("UPDATE users SET weight=? WHERE id=1", (data.weight,))
    conn.commit()
    conn.close()
    return {"date": today, "weight": data.weight}

@app.get("/weight/history")
def get_weight_history():
    conn = get_db()
    rows = conn.execute("SELECT date, weight FROM weight_logs WHERE user_id=1 ORDER BY date DESC LIMIT 14").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/sessions/history")
def get_session_history():
    conn = get_db()
    rows = conn.execute("SELECT * FROM workout_sessions WHERE user_id=1 ORDER BY date DESC LIMIT 30").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.delete("/nutrients/{nutrient_id}")
def delete_nutrient(nutrient_id: int):
    conn = get_db()
    conn.execute("DELETE FROM nutrient_logs WHERE id=? AND user_id=1", (nutrient_id,))
    conn.commit()
    conn.close()
    return {"deleted": True}

@app.get("/nutrients/history")
def get_nutrient_history():
    conn = get_db()
    rows = conn.execute(
        "SELECT date, SUM(calories) as cal, SUM(protein) as pr, SUM(carbs) as cb, SUM(fats) as ft "
        "FROM nutrient_logs WHERE user_id=1 GROUP BY date ORDER BY date DESC LIMIT 14"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/analytics/weekly")
def get_weekly_analytics():
    conn = get_db()
    today = date.today()
    from datetime import timedelta
    week_ago = str(today - timedelta(days=7))
    
    sessions = conn.execute(
        "SELECT date, muscle_group, completed, duration_seconds FROM workout_sessions "
        "WHERE user_id=1 AND date >= ? ORDER BY date ASC", (week_ago,)
    ).fetchall()
    
    water = conn.execute(
        "SELECT date, amount_ml FROM water_logs WHERE user_id=1 AND date >= ? ORDER BY date ASC", (week_ago,)
    ).fetchall()
    
    nutrients = conn.execute(
        "SELECT date, SUM(calories) as cal, SUM(protein) as pr FROM nutrient_logs "
        "WHERE user_id=1 AND date >= ? GROUP BY date ORDER BY date ASC", (week_ago,)
    ).fetchall()
    
    user = conn.execute("SELECT streak, weight FROM users WHERE id=1").fetchone()
    conn.close()
    
    return {
        "sessions": [dict(s) for s in sessions],
        "water": [dict(w) for w in water],
        "nutrients": [dict(n) for n in nutrients],
        "streak": user["streak"] if user else 0,
        "current_weight": user["weight"] if user else 72,
    }

@app.get("/analytics/streak-calendar")
def get_streak_calendar():
    conn = get_db()
    from datetime import timedelta
    today = date.today()
    start = str(today - timedelta(days=84))  # 12 weeks
    rows = conn.execute(
        "SELECT date, completed FROM workout_sessions WHERE user_id=1 AND date >= ? ORDER BY date ASC",
        (start,)
    ).fetchall()
    conn.close()
    calendar = {}
    for r in rows:
        d = r["date"]
        if d not in calendar:
            calendar[d] = {"date": d, "completed": bool(r["completed"]), "sessions": 0}
        calendar[d]["sessions"] += 1
        if r["completed"]:
            calendar[d]["completed"] = True
    return list(calendar.values())

class StudyLog(BaseModel):
    subject: str
    seconds: int
    note: Optional[str] = ""
    mode: str = "stopwatch"
    date: Optional[str] = None

@app.post("/study")
def log_study(data: StudyLog):
    today = data.date or str(date.today())
    conn = get_db()
    conn.execute(
        "CREATE TABLE IF NOT EXISTS study_logs ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER DEFAULT 1, "
        "date TEXT NOT NULL, subject TEXT NOT NULL, seconds INTEGER DEFAULT 0, "
        "note TEXT DEFAULT '', mode TEXT DEFAULT 'stopwatch', "
        "created_at TEXT DEFAULT (datetime('now')))"
    )
    conn.execute(
        "INSERT INTO study_logs (user_id, date, subject, seconds, note, mode) VALUES (1,?,?,?,?,?)",
        (today, data.subject, data.seconds, data.note or "", data.mode)
    )
    conn.commit()
    conn.close()
    return {"logged": True, "date": today}

@app.get("/study/today")
def get_study_today():
    today = str(date.today())
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM study_logs WHERE user_id=1 AND date=? ORDER BY created_at DESC", (today,)
        ).fetchall()
        total = conn.execute(
            "SELECT SUM(seconds) as total FROM study_logs WHERE user_id=1 AND date=?", (today,)
        ).fetchone()
        conn.close()
        return {"logs": [dict(r) for r in rows], "total_seconds": total["total"] or 0}
    except Exception:
        conn.close()
        return {"logs": [], "total_seconds": 0}

@app.get("/study/week")
def get_study_week():
    from datetime import timedelta
    week_ago = str(date.today() - timedelta(days=7))
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT date, subject, SUM(seconds) as seconds FROM study_logs "
            "WHERE user_id=1 AND date >= ? GROUP BY date, subject ORDER BY date DESC",
            (week_ago,)
        ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception:
        conn.close()
        return []

@app.delete("/exercises/{exercise_id}")
def delete_exercise(exercise_id: int):
    conn = get_db()
    conn.execute("DELETE FROM exercises WHERE id=?", (exercise_id,))
    conn.commit()
    conn.close()
    return {"deleted": True}

@app.get("/sessions/{session_id}/exercises")
def get_session_exercises(session_id: int):
    conn = get_db()
    exercises = conn.execute("SELECT * FROM exercises WHERE session_id=?", (session_id,)).fetchall()
    exs = []
    for e in exercises:
        d = dict(e)
        d["sets_data"] = json.loads(d["sets_data"])
        exs.append(d)
    conn.close()
    return exs

@app.get("/stats/overview")
def get_stats_overview():
    conn = get_db()
    today = str(date.today())
    from datetime import timedelta
    week_ago = str(date.today() - timedelta(days=7))
    month_ago = str(date.today() - timedelta(days=30))

    total_sessions = conn.execute("SELECT COUNT(*) FROM workout_sessions WHERE user_id=1").fetchone()[0]
    total_completed = conn.execute("SELECT COUNT(*) FROM workout_sessions WHERE user_id=1 AND completed=1").fetchone()[0]
    this_week = conn.execute("SELECT COUNT(*) FROM workout_sessions WHERE user_id=1 AND completed=1 AND date>=?", (week_ago,)).fetchone()[0]
    total_water = conn.execute("SELECT SUM(amount_ml) FROM water_logs WHERE user_id=1").fetchone()[0] or 0
    total_calories = conn.execute("SELECT SUM(calories) FROM nutrient_logs WHERE user_id=1").fetchone()[0] or 0
    user = conn.execute("SELECT streak FROM users WHERE id=1").fetchone()

    try:
        total_study = conn.execute("SELECT SUM(seconds) FROM study_logs WHERE user_id=1").fetchone()[0] or 0
    except Exception:
        total_study = 0

    conn.close()
    return {
        "total_sessions":   total_sessions,
        "total_completed":  total_completed,
        "completion_rate":  round(total_completed / max(total_sessions, 1) * 100, 1),
        "this_week_sessions": this_week,
        "streak":           user["streak"] if user else 0,
        "total_water_l":    round(total_water / 1000, 1),
        "total_calories":   total_calories,
        "total_study_hours": round(total_study / 3600, 1),
    }
