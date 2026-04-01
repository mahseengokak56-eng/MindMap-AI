# MindMap AI – Predict Before You Break 🧠

> AI-powered mental stress prediction and burnout detection platform

[![Live Demo](https://img.shields.io/badge/Live-Demo-violet)](https://your-app.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-green)](https://your-api.onrender.com)

## 🚀 Quick Start

### Backend
```bash
cd backend
cp .env.example .env      # fill in your MONGO_URI
npm install
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env      # set VITE_API_URL
npm install
npm run dev
```

## 🎯 Features
- **Mood Logger** — emoji selector + daily journal
- **Trigger Engine** — screen time / sleep / study hour sliders
- **Burnout Risk Score** — 0–100 AI score with status (Low/Moderate/High)
- **Dashboard** — live charts, stat cards, trigger detection panel
- **SOS Button** — emergency alert mock
- **Full CORS** — frontend ↔ backend works on Vercel + Render

## 🧠 Burnout Prediction Logic
| Trigger | Impact |
|---|---|
| Screen time > 8h | +20 |
| Screen time > 12h | +10 |
| Sleep < 6h | +30 |
| Sleep < 4h | +10 |
| Study time > 10h | +10 |
| 3 negative moods | +40 |
| 2 negative moods | +20 |
| 1 negative mood | +10 |
| Sleep ≥ 8h (positive) | -10 |

## 🌐 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Root: `frontend/`, Build: `npm run build`, Output: `dist`
4. Add env var: `VITE_API_URL=https://your-api.onrender.com/api`

### Backend → Render
1. New Web Service → connect repo
2. Root: `backend/`, Build: `npm install`, Start: `node server.js`
3. Add env vars: `MONGO_URI`, `PORT=5000`, `FRONTEND_URL=https://your-app.vercel.app`

## 📡 API Reference
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/mood` | Log mood entry |
| GET | `/api/mood/history` | Get mood history |
| POST | `/api/activity` | Log activity data |
| GET | `/api/activity` | Get activity history |
| GET | `/api/predict` | Run burnout prediction |
| GET | `/api/suggestions` | Get latest suggestions |
| POST | `/api/sos` | Trigger SOS alert |
