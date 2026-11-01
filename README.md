# CITYPULSE — Making Every Civic Voice Count
### AI-Powered Civic Complaint Management Platform
**Theme 1: Civic Pulse – Digital Governance & Public Information**

---

## 🌟 Executive Summary

**CityPulse** is an end-to-end civic complaint management and digital governance platform bridging urban citizens with municipal engineering rapid response teams. Powered by FastAPI, multimodal Gemini AI, and a high-performance Vanilla JS responsive interface, CityPulse delivers autonomous AI grievance triage, spatial duplicate detection, automated severity scoring, and citizen-verified repair sign-offs.

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                             CITIZEN & ADMIN UI                            │
│  Vanilla JS (SPA) • Tailwind CSS • Chart.js • Assistant AI Chat Widget    │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ REST API / JWT Bearer
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND CORE                            │
│  Lifespan DB Seeding • Pydantic v2 • SQLite Engine • CORS & Static Mounts │
└───────┬─────────────────────────────┬─────────────────────────────┬───────┘
        │                             │                             │
        ▼                             ▼                             ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│  AI & AGENTS     │        │ CIVIC SERVICES   │        │ SQLITE STORAGE   │
│ • Gemini Vision  │        │ • Duplicate Haversine     │ • 42 Seed Tickets│
│ • Triage Agent   │        │ • Hotspot Clustering      │ • User Auth      │
│ • Severity Engine│        │ • Audit Trail Logger      │ • Evidence Photos│
│ • Assistant Bot  │        │ • SLA Compliance Timer    │ • Feedback Log   │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

---

## ⚡ How AI & Autonomous Agents Power CityPulse

1. **Multimodal Computer Vision Grievance Triage (`/api/ai/analyze-complaint`)**:
   - Analyzes grievance descriptions and uploaded photographic evidence using Google Gemini Flash.
   - Extracts root causes, auto-suggests municipal departments (e.g. BBMP Road Infrastructure, BWSSB Water & Sewage, BESCOM Power), and flags potential safety hazards.
   - **Deterministic Fallback Engine**: If no `GEMINI_API_KEY` is provided, CityPulse automatically activates an internal keyword & heuristics classifier so all features remain 100% operational in zero-config and offline evaluation environments.

2. **Autonomous Severity Scoring & SLA Assignment (`/api/complaints`)**:
   - Combines computer vision hazard indicators, citizen upvotes, duration, and safety factors into a 0–100 severity index.
   - Dynamically schedules response SLAs (e.g. 24h for high-severity hazards, 48h for routine repairs).

3. **Geospatial Duplicate Incident Detection (`duplicate_service.py`)**:
   - Uses Haversine distance calculations and text similarity matching to detect duplicate complaints within a 150-meter radius, consolidating municipal work orders.

4. **Conversational Civic Assistant (`/api/assistant/chat`)**:
   - Interactive floating assistant widget equipped with tool-calling capabilities to query complaint statuses, summarize ward SLAs, and explain municipal grievance procedures.

5. **Closed-Loop Citizen Verification**:
   - Municipal field crews upload post-repair photos; citizens inspect before-and-after proof and can dispute or confirm resolution with star ratings and feedback.

---

## 🚀 Quickstart & Setup Instructions

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.10, 3.11, 3.12, 3.14)
- Pip

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/<your-username>/citypulse.git
cd citypulse

pip install -r requirements.txt
```

### 3. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```

Edit `.env` (optional):
```env
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=supersecretcitypulsekey12345
HOST=0.0.0.0
PORT=8000
```

> **Note on `GEMINI_API_KEY`:** Supplying your Gemini API key activates live multimodal vision inference. If the key is left empty or omitted, CityPulse automatically defaults to its built-in rule-based classification heuristics. **All application features, submissions, and triage functions work completely without an API key.**

### 4. Run the Application
Start the unified server with Uvicorn:
```bash
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
```
Or use the convenience launcher:
```bash
python server.py
```

Open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

Interactive API Swagger documentation is available at:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## 🔐 Demo Credentials

The database auto-seeds 42 realistic municipal grievances, audit timelines, and demo accounts upon first startup:

| Role | Email | Password | Quick Login |
|------|-------|----------|-------------|
| **Citizen** | `citizen@citypulse.org` | `Password123!` | 1-Click Button on `#auth` |
| **Municipal Admin** | `admin@citypulse.org` | `AdminPass123!` | 1-Click Button on `#auth` |

---

## 📑 Application Views & Features

1. **🏛️ Public Landing Page (`#landing`)**:
   - Civic pulse marquee with live telemetry from Bangalore wards.
   - Platform KPI counters (total grievances, SLA compliance rate, average resolution speed).
   - Quick ticket lookup by Complaint ID (e.g. `CP-2026-BLR01`).

2. **👤 Citizen Dashboard (`#citizen-dashboard`)**:
   - Filter complaints by status (All, Pending, In Progress, Resolved).
   - Search grievances by locality, category, or ID.
   - Community issue endorsement (upvoting) with real-time priority escalation.

3. **📝 Report Grievance Portal (`#report`)**:
   - 6 civic categories with dynamic ward selection and simulated GPS tagging ($\pm 4\text{m}$).
   - Photo evidence upload with 1-click sample images (pothole, burst pipe, overflowing waste, dark streetlights).
   - **Live AI Triage Preview**: Displays real-time category detection, department suggestion, severity score, and safety concern detection as you type or drop photos.

4. **🔍 Complaint Tracking & Verification (`#track/:id`)**:
   - Lifecycle milestone timeline with immutable timestamped audit steps.
   - Side-by-side photographic comparison (Before citizen photo vs. After field repair proof).
   - Citizen satisfaction rating (1–5 stars) with *Confirm Closure* or *Dispute Repair* triggers.

5. **🛡️ Municipal Admin Control Center (`#admin-dashboard`)**:
   - Real-time KPI counters: Total, Pending, In Progress, and Certified Resolved.
   - Sector distribution doughnut chart powered by Chart.js.
   - Locality-wise ward performance table tracking SLA adherence rates.
   - Live status dropdown actions: transition tickets directly (`submitted` $\rightarrow$ `in_progress` $\rightarrow$ `resolved`).
   - Triage modal inspector with deep photographic evidence inspection and officer dispatch.

6. **💬 Floating AI Civic Assistant**:
   - Accessible from the bottom-right corner of every screen.
   - Connects directly to the backend assistant agent (`/api/assistant/chat`).
   - Provides instant answers regarding grievance policies, ward SLAs, and ticket lookups.

---

## ☁️ Deployment Instructions (Render / Railway)

CityPulse is production-ready for deployment to platforms like Render, Railway, or Hugging Face Spaces.

### Deploying to Render
1. Create a new **Web Service** on [Render](https://render.com) connected to your GitHub repo.
2. Configure settings:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
3. Under **Environment Variables**, optionally set:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `JWT_SECRET`: *(A random 32-character secret string)*

### Deploying to Railway
1. Click **New Project** $\rightarrow$ **Deploy from GitHub repo**.
2. Railway detects the `requirements.txt` automatically.
3. Set the start command in your service settings:
   ```bash
   uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT
   ```

---

## 📂 Project Structure

```
citypulse/
├── backend/
│   └── app/
│       ├── main.py                  # FastAPI app entry point & static mounting
│       ├── config.py                # App configuration, BASE_DIR, and env vars
│       ├── database.py              # SQLite schema, migrations & auto-seeding
│       ├── models.py                # Pydantic v2 schemas and validation models
│       ├── auth.py                  # JWT authentication & password hashing
│       ├── ai/
│       │   ├── gemini_client.py     # Gemini Flash client with rule-based fallback
│       │   ├── triage_agent.py      # Automated category & severity classifier
│       │   ├── assistant.py         # Conversational agent with civic knowledge
│       │   └── knowledge_base.py    # Municipal charters & SLA guidelines
│       ├── routers/
│       │   ├── auth_router.py       # Citizen/admin login & registration
│       │   ├── complaints_router.py # Complaint submission, tracking & dispute
│       │   ├── admin_router.py      # Triage actions, status update, officer dispatch
│       │   ├── ai_router.py         # Multimodal grievance analysis endpoint
│       │   ├── analytics_router.py  # KPI metrics, ward compliance, category stats
│       │   └── assistant_router.py  # AI Assistant chat endpoint
│       └── services/
│           ├── duplicate_service.py # Spatial Haversine deduplication
│           ├── hotspot_service.py   # Geographic cluster identification
│           ├── resolution_service.py# Before/after verification logic
│           └── severity_service.py  # Multi-factor urgency scoring algorithm
├── js/
│   ├── api.js                       # Universal REST API client with JWT handling
│   ├── assistantChat.js             # Floating AI Chatbot component
│   ├── app.js                       # SPA Router & reactive application state
│   ├── components.js                # Navbar, footer, and toast notifications
│   ├── icons.js                     # SVG vector icon registry
│   ├── mockDb.js                    # Offline resilient storage layer
│   ├── sample_complaints.json       # 42 realistic Bengaluru civic grievances
│   └── views/
│       ├── landing.js               # Landing page view
│       ├── citizenDashboard.js      # Citizen portal view
│       ├── reportComplaint.js       # AI-assisted grievance reporting
│       ├── complaintTracking.js     # Step-by-step audit tracker
│       ├── adminDashboard.js        # Command & control operations hub
│       └── auth.js                  # Login & registration forms
├── assets/                          # SVG illustrations & sample evidence
├── tests/
│   └── test_api.py                  # Pytest test suite for backend routes
├── index.html                       # Single-page application entry point
├── server.py                        # Python runner script
├── requirements.txt                 # Backend Python dependencies
├── .env.example                     # Environment variable template
└── README.md                        # Documentation
```

---

## ⚖️ License
Released under the MIT License. Developed for digital governance and public benefit.
