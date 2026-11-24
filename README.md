# CROWDLESS — Crowd-Aware Delhi Transit Journey Planner
> **Tagline:** Move smarter. Travel calmer.  
> **Hackathon:** IIIT Delhi Transport Stack Hackathon — Problem 2 / Phase 1: Crowdedness-Aware Journey Planner

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![Python](https://img.shields.io/badge/Python-3.14-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.165-teal)
![React](https://img.shields.io/badge/React-18-cyan)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-5.22-indigo)
![Scikit-Learn](https://img.shields.io/badge/RandomForest-MAE_1.68%25-orange)

---

## 1. Overview
How crowded a bus or metro train is matters to a commuter just as much as how long the trip takes. A packed vehicle causes agonizing standing fatigue, slow boarding, and frequent skipped buses. Yet traditional journey planners only rank options by travel time and transfer counts.

**CROWDLESS** is a full-stack, crowd-aware transit journey planner built specifically for the Delhi NCR multimodal network (Delhi Metro + DTC / DIMTS buses). It ingests **2.56 million official electronic ticketing records (ETM and e-ticketing)** from October 2026, models passenger occupancy with empirical pass-holder calibrations, and recommends routes across three distinct commuter-first categories:

1. **FASTEST ROUTE:** Minimizes overall trip duration.
2. **LEAST CROWDED ROUTE:** Maximizes seated comfort and avoids bottleneck crush loads.
3. **BEST BALANCED ROUTE:** Optimal trade-off between reasonable trip duration, low crowd exposure, and minimal transfers.

### Key Visual & Interactive Features
- **Map Crowd Heatmap:** Stretch-by-stretch crowd density depiction (Green for Seats Available, Amber for Standing Room, Red for Crush Load).
- **Simultaneous Alternative Bypass Depiction on Map:** The map depicts **both the main route and alternative bypass routes simultaneously** as color-coded dashed lines with interactive midpoint click-to-switch badges.
- **Cinema-Style Bus Seat Selection:** Interactive 35-seat floor plan (12m Delhi bus) with dynamic occupancy derived directly from the ML crowd model, letting commuters reserve window or aisle seats just like a movie ticket on BookMyShow.
- **Crowd Dissolution Clock:** Predicts the exact wall-clock time when rush-hour congestion will dissolve (e.g. *Peak rush clears at 07:45 PM*), with a smart *Leave Later* time-shift advisor.

---

## 2. Technology Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React | Modern, high-energy UI with electric indigo & emerald gradients |
| **Mapping** | MapLibre GL JS + OpenStreetMap Tiles | Real station coordinates, multi-route rendering, stretch crowd heatmaps, bottleneck callouts |
| **Charts & Analytics** | Recharts | 24-hour passenger density curves, peak window visualization, station footfall bars |
| **Backend API** | Node.js, Express.js, TypeScript | REST APIs, request validation, CORS, error handling |
| **Database** | SQLite + Prisma ORM | Relational schema with migrations, station indices, and route stops |
| **Routing Engine** | Graph-based Dijkstra + Diversity Masks | Shortest-path search, alternative path discovery, multimodal transfers |
| **Crowd ML Service** | Python, FastAPI, Pandas, Scikit-learn, Joblib | `RandomForestRegressor` (100 Trees, Depth 12), MAE: 0.0168 |

---

## 3. Project Structure

```text
crowdless/
├── backend/                  # Node.js Express + TypeScript backend
│   ├── prisma/               # Prisma schema and seed script
│   │   ├── schema.prisma     # Relational DB models
│   │   └── seed.ts           # Real Delhi stations, lines, and routes seed
│   ├── src/
│   │   ├── index.ts          # Unified server entry with static frontend serving
│   │   ├── prisma.ts         # Prisma singleton client
│   │   ├── routes/api.ts     # 8 core REST endpoints
│   │   └── services/
│   │       ├── routingEngine.ts  # Dijkstra graph algorithm & multi-path generator
│   │       ├── crowdService.ts   # Microservice connector & local cache fallback
│   │       └── rankingService.ts # Multi-criteria commuter route ranking engine
│   ├── test-routing.ts       # Dijkstra & crowd-ranking automated verification
│   └── test-suite.py         # 9-endpoint end-to-end integration test
├── ml-service/               # Python FastAPI crowd prediction service
│   ├── main.py               # FastAPI server (inference, route curves, analytics)
│   ├── crowd_model.joblib    # Serialized trained RandomForestRegressor
│   └── model_metrics.json    # Model evaluation metrics (MAE, RMSE, parameters)
├── frontend/                 # React + TypeScript + Vite application
│   ├── src/
│   │   ├── App.tsx           # Route definitions
│   │   ├── api.ts            # Typed client API layer
│   │   ├── types.ts          # Shared TypeScript interfaces
│   │   ├── components/
│   │   │   ├── Navbar.tsx                   # Responsive navigation bar with live status badge
│   │   │   ├── Footer.tsx                   # Technical references and documentation links
│   │   │   ├── MapLibreView.tsx             # MapLibre GL map with multi-route heatmap & bypass lines
│   │   │   ├── BusSeatBookingModal.tsx      # Cinema-style interactive 35-seat floor plan & QR pass
│   │   │   └── CrowdDissolutionAdvisor.tsx  # Congestion relief clock & bypass route advisor
│   │   └── pages/
│   │       ├── LandingPage.tsx        # Hero, quick search, interactive map preview
│   │       ├── JourneyPlannerPage.tsx # Core planner with 3 recommendation tiers & seat selection
│   │       ├── AnalyticsPage.tsx      # 24h crowd curves & peak windows (Recharts)
│   │       ├── StationDetailPage.tsx  # Station-level footfall & connected routes
│   │       └── NetworkStatusPage.tsx  # DMRC Metro & DTC bus line monitoring
├── datasets/                 # Real transit data and pipeline summaries
│   ├── October-Delhi.csv     # 290MB official ticketing dataset (2.56M rows)
│   ├── route_crowd_summary.json # Aggregated hourly profiles for 2,259 routes
│   └── stop_footfall_summary.json # Station-level footfall summaries for top stops
├── docs/
│   ├── TECHNICAL_NOTE.md     # In-depth scientific note on methodology & math
│   ├── PROJECT_PROPOSAL.md   # Hackathon project proposal
│   └── DEMO_SCRIPT.md        # 2-minute video presentation script
├── scripts/
│   └── process_october_data.py # Data pipeline: streaming ETM ingestion & ML training
├── start-all.bat             # One-click Windows batch launcher
├── start-all.ps1             # One-click PowerShell launcher
├── .env.example              # Environment variables template
└── README.md                 # Complete documentation
```

---

## 4. Quick Start & Execution

### Option A: One-Click Launch (Windows)
Double-click `start-all.bat` or run in PowerShell:
```powershell
cd C:\Users\Dell\.gemini\antigravity\scratch\crowdless
.\start-all.ps1
```
This automatically starts:
- Python ML Service on `http://127.0.0.1:8000`
- Unified Web Application & Backend API on `http://localhost:5000`
- Automatically opens the web application in your browser!

---

### Option B: Step-by-Step Manual Startup

#### Step 1: Start the Python ML Service
```bash
cd ml-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*Health check:* `http://127.0.0.1:8000/health`

#### Step 2: Seed Database & Start Backend Server
In a second terminal:
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run build
node dist/src/index.js
```
*The backend unified server serves both REST APIs and the compiled React frontend at `http://localhost:5000`!*

#### Step 3: (Optional) Frontend Vite Dev Server
In a third terminal (for hot reloading):
```bash
cd frontend
npm install
npm run dev
```
*Vite Dev Server:* `http://localhost:5173`

---

## 5. End-to-End Test Suite Verification

Run the automated integration test suite:
```bash
python backend/test-suite.py
```

### Verified Test Results:
```text
=== 1. Node Health ===
Health: 200 {'status': 'ok', 'database': {'status': 'connected', 'stations': 25, 'routes': 9}, 'mlService': {'status': 'healthy'}}

=== 2. ML Health ===
ML Health: 200 {'status': 'healthy', 'model_status': 'TRAINED', 'model_type': 'RandomForestRegressor', 'mae': 0.0168, 'rmse': 0.0307}

=== 3. Route Search (Anand Vihar -> Connaught Place @ 18:00 Peak) ===
Total Candidate Routes: 3
  [Fastest Route] Blue Line Main + 534UP - 30 mins | Crowd: Standing Room (60%)
  [Least Crowded] 85UP + Airport Express Line - 32 mins | Crowd: Seats Available (17%)
  [Best Balanced] Blue Line Main + Yellow Line Express - 35 mins | Crowd: Standing Room (64%)

ALL 9 ENDPOINT CHECKS SUCCEEDED 100%!
```

---

## 6. Official Data Grounding & Crowding Model

1. **Dataset:** 2,559,899 ticket transactions from October 2026 Delhi Transport Stack.
2. **Pass-Holder Multiplier (1.38x):** Calibrated to account for unrecorded zero-fare Pink tickets (female commuters) and student/senior concession passes.
3. **Capacity Baseline:** Standard 12m DTC bus (35 seats, 65 licensed capacity).
4. **Machine Learning Model:** Tuned `RandomForestRegressor` with 100 trees achieving an empirical **Mean Absolute Error (MAE) of 0.0168** (~1.68% error) across 65,811 hourly route observations.
5. **Transparency Status:** All outputs explicitly state data provenance:
   - `OBSERVED`: Direct historical match from October 2026 ETM logs.
   - `PREDICTED`: Inferred by the trained Random Forest model.
   - `DEMO`: Temporal baseline fallback.

---

## 7. Hackathon Deliverables

- [Technical Note (Methodology, Math & Assumptions)](docs/TECHNICAL_NOTE.md)
- [Project Proposal](docs/PROJECT_PROPOSAL.md)
- [Video Demonstration Script](docs/DEMO_SCRIPT.md)

---

## 8. License & Acknowledgments
Built for the **IIIT Delhi Transport Stack Hackathon 2026**. Data provided by the Transport Department, Government of NCT of Delhi, and the Delhi Transport Stack platform.
