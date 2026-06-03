# APPLYFY – Student Job Application Tracker
### BUS4012 Assignment 3 | Student ID: 22877755

A full-stack job application tracker for students, built with React (frontend), FastAPI/Python (backend), and Supabase (database), deployed on Vercel.

---

## Architecture

```
┌─────────────────────┐     HTTPS/REST      ┌──────────────────────┐
│   React Frontend    │ ──────────────────► │  Python/FastAPI       │
│   (Vercel)          │                     │  Backend (Vercel)     │
└─────────────────────┘                     └──────────┬───────────┘
                                                        │ supabase-py
                                            ┌───────────▼───────────┐
                                            │   Supabase Database   │
                                            │   (PostgreSQL)        │
                                            └───────────────────────┘
```

- **Frontend**: React + Vite, deployed to Vercel (`/frontend`)
- **Backend**: FastAPI (Python), deployed to Vercel as serverless functions (`/backend`)
- **Database**: Supabase (PostgreSQL) – stores users and applications

---

## Project Structure

```
applyfy/
├── frontend/
│   ├── src/
│   │   ├── main.jsx        # All React components & app logic
│   │   ├── api.js          # API service layer (all fetch calls)
│   │   └── styles.css      # Styling
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example        # Template – copy to .env and fill in
│
├── backend/
│   ├── main.py             # FastAPI app with all routes
│   ├── requirements.txt    # Python dependencies
│   ├── vercel.json         # Vercel deployment config
│   └── .env.example        # Template – copy to .env and fill in
│
├── supabase_schema.sql     # Run this in Supabase SQL Editor
├── .gitignore
└── README.md
```

---

## Local Development Setup

### 1. Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase_schema.sql`
3. Copy your **Project URL** and **service_role key** from Settings → API

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY in .env

python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# Backend runs at http://localhost:8000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000

npm install
npm run dev
# Frontend runs at http://localhost:5173
```

---

## Deployment (Vercel)

### Backend
1. Push code to GitHub
2. Create a new Vercel project → import your repo → set **Root Directory** to `backend`
3. Add environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
4. Deploy

### Frontend
1. Create another Vercel project → set **Root Directory** to `frontend`
2. Add environment variable:
   - `VITE_API_URL` = your deployed backend URL (e.g. `https://applyfy-backend.vercel.app`)
3. Deploy

---

## Security: Credential Management

| Secret | Where stored |
|--------|-------------|
| `SUPABASE_URL` | Backend `.env` + Vercel env vars |
| `SUPABASE_SERVICE_KEY` | Backend `.env` + Vercel env vars (**never** in frontend) |
| `VITE_API_URL` | Frontend `.env` (not secret – just a URL) |

The `.gitignore` excludes all `.env` files so secrets are never committed to GitHub.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users` | Create or update user profile |
| `GET` | `/api/users/{email}` | Get user profile |
| `GET` | `/api/applications/{email}` | Get all applications for user |
| `POST` | `/api/applications` | Add a new application |
| `PATCH` | `/api/applications/{id}/status` | Update application status |
| `DELETE` | `/api/applications/{id}` | Delete an application |

---

## GitHub URL
[https://github.com/YOUR_USERNAME/applyfy](https://github.com/YOUR_USERNAME/applyfy)
*(Update this with your actual GitHub URL before submission)*
