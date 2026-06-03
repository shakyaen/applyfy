from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = "https://nybowqwgvcuzoezxuewl.supabase.co"
SUPABASE_KEY = "sb_secret_biwmRH6204P7R6teRXdN7g_hFnVOr10"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="APPLYFY API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------- Pydantic Models -------

class UserProfile(BaseModel):
    email: str
    university: str
    year: str
    study_area: str
    job_type: str
    reminder_pref: str


class Application(BaseModel):
    user_email: str
    company: str
    role: str
    type: str
    deadline: Optional[str] = None
    source: Optional[str] = None
    link: Optional[str] = None
    status: str = "Applied"
    reminder: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


# ------- Routes -------

@app.get("/")
def root():
    return {"message": "APPLYFY API is running"}


@app.post("/api/users")
def upsert_user(profile: UserProfile):
    """Create or update a user profile."""
    data = {
        "email": profile.email,
        "university": profile.university,
        "year": profile.year,
        "study_area": profile.study_area,
        "job_type": profile.job_type,
        "reminder_pref": profile.reminder_pref,
    }
    result = supabase.table("users").upsert(data, on_conflict="email").execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save user profile")
    return {"success": True, "user": result.data[0]}


@app.get("/api/users/{email}")
def get_user(email: str):
    """Retrieve a user profile by email."""
    result = supabase.table("users").select("*").eq("email", email).execute()
    if not result.data:
        return {"user": None}
    return {"user": result.data[0]}


@app.get("/api/applications/{user_email}")
def get_applications(user_email: str):
    """Retrieve all applications for a user."""
    result = (
        supabase.table("applications")
        .select("*")
        .eq("user_email", user_email)
        .order("created_at", desc=True)
        .execute()
    )
    return {"applications": result.data}


@app.post("/api/applications")
def add_application(app_data: Application):
    """Add a new job application."""
    data = {
        "user_email": app_data.user_email,
        "company": app_data.company,
        "role": app_data.role,
        "type": app_data.type,
        "deadline": app_data.deadline,
        "source": app_data.source,
        "link": app_data.link,
        "status": app_data.status,
        "reminder": app_data.reminder,
    }
    result = supabase.table("applications").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save application")
    return {"success": True, "application": result.data[0]}


@app.patch("/api/applications/{application_id}/status")
def update_status(application_id: int, body: StatusUpdate):
    """Update the status of an application."""
    result = (
        supabase.table("applications")
        .update({"status": body.status})
        .eq("id", application_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"success": True, "application": result.data[0]}


@app.delete("/api/applications/{application_id}")
def delete_application(application_id: int):
    """Delete an application."""
    result = (
        supabase.table("applications")
        .delete()
        .eq("id", application_id)
        .execute()
    )
    return {"success": True}
