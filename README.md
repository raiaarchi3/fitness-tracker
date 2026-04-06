# Obsidian Lens — Full Stack Fitness Tracker

Dark-themed personal performance vault. Track workouts, nutrition, hydration, study hours, body measurements, and streaks.

## Tech stack
- **Frontend**: Next.js 14 · Tailwind CSS · plain JavaScript (no TypeScript)
- **Backend**: Python FastAPI
- **Database**: SQLite (auto-created on first run, zero setup needed)
- **Deploy**: Docker Compose (one command)

---

## Quick start

### Option A — Docker (recommended, one command)
```bash
git clone <repo>
cd obsidian-lens
docker compose up --build
```
Open → http://localhost:3000

### Option B — Local dev (two terminals)
```bash
# Terminal 1
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend
npm install
npm run dev
```
Open → http://localhost:3000

---

## Install as a phone app (PWA)
| Platform | Steps |
|----------|-------|
| Android Chrome | Tap ⋮ → "Add to Home Screen" |
| iPhone Safari | Tap Share → "Add to Home Screen" |

Once installed, hourly water reminders and daily gym alerts work like a native app.

---

## All pages

| Route | Description |
|-------|-------------|
| `/` | Home dashboard — water, protein, calories, study hours, weight chart |
| `/onboarding` | First-run setup wizard (auto-redirects new users) |
| `/session/[id]` | Live workout — timer, sets/reps/weight, rest timer, add exercises |
| `/session/new` | Redirect helper — starts session from today's split |
| `/nutrition` | Food log — 15 presets, macro bars, delete entries, custom log |
| `/study` | Pomodoro (25m) + stopwatch — subject tagging, weekly chart |
| `/history` | Performance Vault — spark charts, 12-week grid, macro donut |
| `/stats` | Lifetime stats — achievements, muscle breakdown, all-time records |
| `/measurements` | Body measurements — 11 fields, trend sparklines, history |
| `/settings` | Profile, goal, weight log, calculated targets, weight trend predictor |
| `/notifications` | Granular reminder toggles — water hours, gym alert time, meals |
| `/workout/history` | Past sessions list — filter by muscle, expandable cards |
| `/workout/split` | Weekly split customiser — tap-to-assign + 4 presets |
| `/workout/progress` | Exercise personal bests — log lifts, progression sparklines |
| `/export` | Download all data as JSON or CSV |
| `/404` | Auto-redirects home after 5s |

---

## Components
| File | What it does |
|------|-------------|
| `BottomNav.js` | 5-tab navigation bar with PWA safe area support |
| `RingProgress.js` | Animated SVG ring chart (protein, etc.) |
| `StreakBadge.js` | Reusable golden streak counter |
| `Toast.js` | In-app notification system (success/error/info/warning) |
| `WeightTrendPredictor.js` | Linear regression weight predictor with 4/8/12-week projections |

---

## Backend API

### User
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/user` | Get user profile |
| PUT | `/user` | Update profile |
| GET | `/today` | Full dashboard snapshot |

### Workouts
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/sessions/start` | Start session (auto-populates exercises) |
| GET | `/sessions/{id}` | Get session + exercises |
| POST | `/sessions/{id}/exercises` | Add exercise |
| PUT | `/exercises/{id}` | Update exercise sets/data |
| DELETE | `/exercises/{id}` | Delete exercise |
| POST | `/sessions/{id}/complete` | Finish session + update streak |
| GET | `/sessions/history` | Last 30 sessions |

### Nutrition
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/nutrients` | Log food entry |
| GET | `/nutrients/today` | Today's logs + totals |
| DELETE | `/nutrients/{id}` | Delete entry |
| GET | `/nutrients/history` | 14-day macro history |

### Water, Weight, Study
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/water` | Log water (adds to daily total) |
| GET | `/water/week` | 7-day water log |
| POST | `/weight` | Log body weight |
| GET | `/weight/history` | Last 14 entries |
| POST | `/study` | Log study session |
| GET | `/study/today` | Today's study total + sessions |
| GET | `/study/week` | 7-day study breakdown |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/analytics/weekly` | 7-day dashboard data |
| GET | `/analytics/streak-calendar` | 12-week workout calendar |
| GET | `/stats/overview` | All-time stats summary |

---

## Data storage

All data is local — no cloud, no accounts, no ads.

| Store | What lives here |
|-------|----------------|
| SQLite `obsidian.db` | Workouts, nutrition, water, weight, study logs, streak |
| `localStorage` | Workout split, exercise PBs, body measurements, notification prefs |

To reset: `rm backend/obsidian.db` (Docker: `docker volume rm obsidian-lens_db_data`)

---

## Local-only data (localStorage)
These are stored on your device only and not exported by the backend:
- Custom workout split (`ob_split`)
- Exercise personal bests (`ob_exercise_pbs`)  
- Body measurements (`ob_measurements`)
- Notification preferences (`ob_notif_prefs`)

Use the **Export** page (`/export`) to download everything as JSON or CSV.
