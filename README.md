# 🏥 CareConnect — MedFlow AI

### AI-Powered Lead Conversion & Appointment Booking Agent

**GLITCHCON 2.0 · Team Bugged · GKM_13**

---

## 📌 Overview

CareConnect is an intelligent healthcare lead conversion system that qualifies patient inquiries across multiple channels and books doctor appointments automatically — all reflected live on a hospital management dashboard.

Patients reach the system via a **Web Chat Widget** or **Telegram Bot**. The AI qualifies their symptoms through a guided conversation, scores them as **Hot / Warm / Cold**, and books the best available slot — updating both the **Hospital Dashboard** and **Patient Dashboard** in real time.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat Agent** | Custom ML model for intent classification, service detection & lead scoring |
| 📊 **Hospital Dashboard** | Live lead tracking with scores, statuses, channel badges & analytics |
| 🗓 **Appointment Booking** | 14 doctors × 7 specialties × multi-week schedule (~1000+ slots) |
| 👤 **Patient Dashboard** | Personal appointment calendar with real-time status polling |
| 📱 **Telegram Bot** | Full qualify → score → book → view appointments flow |
| 💬 **Web Chat Widget** | Embedded chat on the website for direct patient interaction |
| 🌐 **Multi-channel Tracking** | Web / Telegram channel badges visible on the dashboard |
| 🧠 **Custom ML Model** | Team-built intent classifier + lead scorer (scikit-learn) |

---

## 🏗 Architecture & Project Structure

```
CareConnect/
│
├── backend/
│   ├── app.py                     # Flask API server (port 5001)
│   ├── ai_module.py               # Gemini AI integration (fallback)
│   ├── telegram_bot.py            # Telegram bot (long polling)
│   ├── .env                       # Backend secrets (not committed)
│   │
│   └── ai/
│       └── fresh_new_combine_final/
│           ├── ai_module.py           # Custom AI module entry
│           ├── conversation_engine.py # Guided question flow
│           ├── intent_classifier.py   # ML intent classification
│           ├── feature_mapper.py      # Feature extraction
│           ├── doctor_scheduler.py    # Slot scheduling logic
│           ├── adaptive_learning.py   # Adaptive scoring
│           ├── analytics.py           # Analytics module
│           ├── logger.py              # Logging utility
│           ├── train_intent_model.py  # Intent model training script
│           ├── train_lead_model.py    # Lead model training script
│           ├── models/
│           │   ├── intent_model.pkl   # Trained intent classifier
│           │   └── lead_model.pkl     # Trained lead scoring model
│           └── data/
│               ├── intent_dataset.csv
│               ├── lead_dataset.csv
│               ├── augmented_dataset.csv
│               └── appointments.json
│
├── frontend/
│   └── glitchcon-frontend/            # React App (Create React App)
│       ├── .env                       # Frontend env (not committed)
│       ├── package.json
│       ├── public/
│       └── src/
│           ├── App.jsx                # Main app with routing
│           ├── index.css              # Global styles
│           ├── components/
│           │   └── ChatWidget.jsx     # Embedded AI chat widget
│           ├── pages/
│           │   ├── HomePage.jsx       # Landing page
│           │   ├── Dashboard.jsx      # Hospital admin dashboard
│           │   ├── PatientDashboard.jsx  # Patient appointments view
│           │   ├── PatientLogin.jsx   # Patient authentication
│           │   ├── PatientLanding.jsx # Patient portal landing
│           │   ├── ChatPreview.jsx    # Chat preview page
│           │   └── ConfirmationPage.jsx  # Booking confirmation
│           └── api/
│               └── apiClient.js       # Axios API client
│
├── .gitignore
└── README.md
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, Flask, Flask-CORS, SQLite |
| **Frontend** | React 19, React Router 7, Axios |
| **AI / ML** | scikit-learn (intent classifier + lead scorer) |
| **Telegram Bot** | python-telegram-bot (long polling) |
| **Database** | SQLite (auto-created at `backend/glitchcon.db`) |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Python** 3.10 or higher → [Download](https://www.python.org/downloads/)
- **Node.js** 18 or higher → [Download](https://nodejs.org/)
- **pip** (comes with Python)
- **npm** (comes with Node.js)
- **Gemini API Key** (free tier) → [Get one here](https://aistudio.google.com/app/apikey)
- **Telegram Bot Token** → Create via [@BotFather](https://t.me/BotFather) on Telegram

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/CareConnect.git
cd CareConnect
```

---

### Step 2 — Backend Setup

#### 2.1 Install Python Dependencies

```bash
cd backend
pip install flask flask-cors python-dotenv requests scikit-learn pandas numpy
```

#### 2.2 Create Backend `.env` File

Create a file named `.env` inside the `backend/` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_TOKEN=your_telegram_bot_token_here
BACKEND_URL=http://127.0.0.1:5001
```

> **⚠️ Important:** Never commit your `.env` file. It is already listed in `.gitignore`.

#### 2.3 Train the ML Models (First Time Only)

Before running the backend for the first time, train the intent classifier and lead scoring models:

```bash
cd ai/fresh_new_combine_final
python train_intent_model.py
python train_lead_model.py
cd ../..
```

This generates `intent_model.pkl` and `lead_model.pkl` inside `ai/fresh_new_combine_final/models/`.

#### 2.4 Start the Backend Server

```bash
python app.py
```

The Flask server will start on **http://127.0.0.1:5001**.

You should see:
```
 * Running on http://127.0.0.1:5001
```

> The SQLite database (`glitchcon.db`) is auto-created on first run.

---

### Step 3 — Frontend Setup

Open a **new terminal** (keep the backend running).

#### 3.1 Install Node Dependencies

```bash
cd frontend/glitchcon-frontend
npm install
```

#### 3.2 Create Frontend `.env` File

Create a file named `.env` inside the `frontend/glitchcon-frontend/` folder:

```env
REACT_APP_API_URL=http://127.0.0.1:5001
```

#### 3.3 Start the Frontend Dev Server

```bash
npm start
```

The React app will open on **http://localhost:3000**.

| Page | URL |
|------|-----|
| Home | `http://localhost:3000/` |
| Hospital Dashboard | `http://localhost:3000/dashboard` |
| Patient Login | `http://localhost:3000/patient/login` |
| Patient Dashboard | `http://localhost:3000/patient/dashboard` |

---

### Step 4 — Telegram Bot Setup

Open a **third terminal** (keep both backend & frontend running).

#### 4.1 Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **HTTP API Token** you receive
4. Paste it as `TELEGRAM_TOKEN` in `backend/.env`

#### 4.2 Start the Telegram Bot

```bash
cd backend
python telegram_bot.py
```

The bot uses **long polling** (no webhook / ngrok / public URL required).

#### 4.3 Using the Bot

1. Open Telegram and search for your bot by its username
2. Send `/start` to begin
3. The bot will guide you through:
   - 🗣 **Symptom description** — describe your health concern
   - ❓ **Qualifying questions** — 3 AI-generated follow-up questions
   - 📊 **Lead scoring** — you'll be scored as Hot / Warm / Cold
   - 📅 **Appointment booking** (if Hot/Warm) — pick a slot
   - ✅ **Confirmation** — booking summary with doctor & time
4. Send `/appointments` to view your existing bookings
5. Send `/reset` to start a new conversation

---

## 🔌 API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/test` | Health check — returns `{ "status": "ok" }` |
| `POST` | `/api/leads/capture` | Capture a new patient lead |
| `POST` | `/api/chat` | Send a message to the AI chat agent |
| `GET` | `/api/leads` | Retrieve all leads (for Hospital Dashboard) |
| `GET` | `/api/analytics` | Dashboard analytics (counts, scores, channels) |

### Appointment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/appointments/availability` | Get available slots (optionally filter by specialty) |
| `POST` | `/api/appointment/book` | Book an appointment slot |

### Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/patient/login` | Patient login by phone number |
| `GET` | `/api/patient/appointments` | Get appointments for a patient |

### ML Model Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/model/import` | Import ML model JSON output (lead profile) |

---

## 🤖 AI Conversation Flow

```
Patient sends a message (Web / Telegram)
  │
  ├─ 1. Intent Classification     → detects healthcare intent
  ├─ 2. Service Detection          → maps to a medical specialty
  ├─ 3. Qualifying Questions (×3)  → AI asks follow-up questions
  ├─ 4. Lead Scoring               → scored as Hot / Warm / Cold
  │     │
  │     ├─ 🔥 Hot / 🟡 Warm → show available slots → book appointment
  │     └─ 🧊 Cold            → added to nurture pipeline
  │
  └─ 5. Dashboard updates automatically (Hospital + Patient)
```

---

## 🧠 Custom ML Model

The ML model lives in `backend/ai/fresh_new_combine_final/` and consists of:

| Component | File | Description |
|-----------|------|-------------|
| Intent Classifier | `intent_classifier.py` | Classifies patient messages into healthcare intents |
| Lead Scorer | `train_lead_model.py` | Trains a model to score leads as Hot/Warm/Cold |
| Conversation Engine | `conversation_engine.py` | Manages the qualifying question flow |
| Feature Mapper | `feature_mapper.py` | Extracts features from patient responses |
| Doctor Scheduler | `doctor_scheduler.py` | Handles doctor availability & slot matching |

### Training Data

| File | Description |
|------|-------------|
| `data/intent_dataset.csv` | Labeled intent training data |
| `data/lead_dataset.csv` | Lead scoring training data |
| `data/augmented_dataset.csv` | Augmented dataset for improved accuracy |
| `data/appointments.json` | Sample appointment data |

---

## 👥 Predefined Test Patients

Use these credentials to log in to the Patient Dashboard:

| Patient ID | Name | Phone |
|------------|------|-------|
| P001 | Ravi Kumar | 9876543210 |
| P002 | Sneha Iyer | 9845001234 |
| P003 | Arjun Mehta | 9901122334 |
| P004 | Priya Nair | 9988776655 |
| P005 | Kiran Das | 9123456789 |

---

## 🏥 Doctors & Specialties

| Specialty | Doctors |
|-----------|---------|
| Cardiology | Dr. Priya Menon, Dr. Arjun Rao |
| Orthopedics | Dr. Meena Krishnan, Dr. Suresh Kumar |
| Neurology | Dr. Ananya Seth, Dr. Vinod Nair |
| General Medicine | Dr. Ramesh Pillai, Dr. Deepa Menon |
| Pediatrics | Dr. Kavya Nair, Dr. Ritu Sharma |
| Oncology | Dr. Vikram Shah, Dr. Anjali Roy |
| Diagnostics | Dr. Suresh Iyer, Dr. Lakshmi Rao |

---

## 📋 Quick Start Summary

```
# Terminal 1 — Backend
cd backend
pip install flask flask-cors python-dotenv requests scikit-learn pandas numpy
python app.py

# Terminal 2 — Frontend
cd frontend/glitchcon-frontend
npm install
npm start

# Terminal 3 — Telegram Bot
cd backend
python telegram_bot.py
```

> **All three processes must be running simultaneously for the full system to work.**

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|---------|
| `ModuleNotFoundError` | Run `pip install <module>` for the missing package |
| Backend won't start | Check if port 5001 is free: `lsof -i :5001` (Mac/Linux) or `netstat -ano \| findstr 5001` (Windows) |
| Frontend can't reach backend | Ensure `REACT_APP_API_URL` in `frontend/.env` matches the backend URL |
| Telegram bot not responding | Verify `TELEGRAM_TOKEN` in `backend/.env` is correct |
| Database errors | Delete `backend/glitchcon.db` and restart — it auto-regenerates |
| ML model errors | Re-train models: `cd backend/ai/fresh_new_combine_final && python train_intent_model.py && python train_lead_model.py` |

---

## 📄 License

This project was built for **GLITCHCON 2.0** hackathon and is intended for educational / demonstration purposes.

---

## 👨‍💻 Team

**Team Bugged · GKM_13 · GLITCHCON 2.0**

| Name | Reg No |
|------|--------|
| Sanjay R | 23BPS1119 |
| Sahana R | 23BPS1190 |
| Sanjana R | 23BPS1155 |
| Suvan B | 23BPS1023 |
| Sowmya P | 23BPS1102 |
| Gurhoshiaa S | 23BPS1006 |
