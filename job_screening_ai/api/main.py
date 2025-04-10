import os
import shutil
import uuid
import sys
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents import (
    JobDescription, JobRequirement, JDParserAgent,
    CandidateProfile, CandidateExperience, CandidateEducation, ResumeParserAgent,
    MatchResult, MatcherAgent,
    ShortlistResult, ShortlisterAgent,
    EmailResult, EmailSchedulerAgent
)
from database import DatabaseManager

# Initialize FastAPI app
app = FastAPI(
    title="Job Screening AI API",
    description="API for AI-powered job screening and candidate matching",
    version="1.0.0"
)

# CORS (development only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and agents
db = DatabaseManager()
jd_parser = JDParserAgent()
resume_parser = ResumeParserAgent()
matcher = MatcherAgent()
shortlister = ShortlisterAgent()
email_scheduler = EmailSchedulerAgent()

# Data directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
RESUME_DIR = os.path.join(DATA_DIR, "resumes")
JD_DIR = os.path.join(DATA_DIR, "job_descriptions")

os.makedirs(RESUME_DIR, exist_ok=True)
os.makedirs(JD_DIR, exist_ok=True)

# ------------------ Pydantic Models ------------------ #
class JobDescriptionRequest(BaseModel):
    job_description_text: str

class ParseResumeResponse(BaseModel):
    candidate_id: str
    name: str
    email: str
    skills: List[str]
    success: bool

class ParseJobResponse(BaseModel):
    job_id: str
    title: str
    company: str
    success: bool

class MatchRequest(BaseModel):
    job_id: str
    candidate_ids: Optional[List[str]] = None

class ShortlistRequest(BaseModel):
    job_id: str
    threshold: Optional[float] = 70.0

class EmailRequest(BaseModel):
    job_id: str
    candidate_ids: List[str]
    email_type: str = "interview_invitation"
    num_slots: int = 3

# Response models for consistent docs
default_any = Dict[str, Any]

class MatchResponse(BaseModel):
    job_title: str
    company: str
    candidates_matched: int
    matches: List[Dict[str, Any]]

class ShortlistResponse(BaseModel):
    job_title: str
    company: str
    threshold_score: float
    total_candidates: int
    shortlisted_count: int
    shortlisted_candidates: List[str]

class EmailScheduleResponse(BaseModel):
    message: str
    job_title: str
    company: str
    email_type: str
    candidates: int
    status: str

# ------------------ Helpers ------------------ #
def save_upload_file(upload_file: UploadFile, destination: str, filename: Optional[str] = None) -> str:
    """Save an uploaded file to destination (with optional custom filename)"""
    name = filename or upload_file.filename
    file_path = os.path.join(destination, name)
    with open(file_path, "wb") as buf:
        shutil.copyfileobj(upload_file.file, buf)
    return file_path


def dict_to_job_description(job_dict: Dict[str, Any]) -> JobDescription:
    """Convert dict to JobDescription"""
    req = job_dict.get("requirements", {})
    if isinstance(req, str):
        try:
            req = json.loads(req)
        except json.JSONDecodeError:
            req = {}
    requirements = JobRequirement(
        required_skills=req.get("required_skills", []),
        preferred_skills=req.get("preferred_skills", []),
        experience=req.get("experience", ""),
        education=req.get("education", [])
    )
    return JobDescription(
        job_id=job_dict.get("job_id"),
        title=job_dict.get("title", ""),
        company=job_dict.get("company", ""),
        location=job_dict.get("location", ""),
        job_type=job_dict.get("job_type", ""),
        description=job_dict.get("description", ""),
        responsibilities=job_dict.get("responsibilities", []),
        requirements=requirements,
        salary_range=job_dict.get("salary_range", ""),
        posting_date=job_dict.get("posting_date", ""),
        department=job_dict.get("department", "")
    )


def dict_to_candidate_profile(candidate_dict: Dict[str, Any]) -> CandidateProfile:
    """Convert dict to CandidateProfile"""
    # Experiences
    exp_list = candidate_dict.get("experience", [])
    if isinstance(exp_list, str):
        try:
            exp_list = json.loads(exp_list)
        except json.JSONDecodeError:
            exp_list = []
    experiences = [CandidateExperience(**exp) for exp in exp_list]
    # Education
    edu_list = candidate_dict.get("education", [])
    if isinstance(edu_list, str):
        try:
            edu_list = json.loads(edu_list)
        except json.JSONDecodeError:
            edu_list = []
    educations = [CandidateEducation(**edu) for edu in edu_list]
    # Skills, certs, languages
    def load_list(key):
        v = candidate_dict.get(key, [])
        if isinstance(v, str):
            try:
                v = json.loads(v)
            except:
                v = []
        return v
    skills = load_list("skills")
    certifications = load_list("certifications")
    languages = load_list("languages")
    return CandidateProfile(
        candidate_id=candidate_dict.get("candidate_id"),
        name=candidate_dict.get("name", ""),
        email=candidate_dict.get("email", ""),
        phone=candidate_dict.get("phone", ""),
        location=candidate_dict.get("location", ""),
        linkedin=candidate_dict.get("linkedin", ""),
        summary=candidate_dict.get("summary", ""),
        skills=skills,
        experience=experiences,
        education=educations,
        certifications=certifications,
        languages=languages
    )

# ------------------ Routes ------------------ #
@app.get("/", tags=["Health"])
async def root():
    return {"message": "Job Screening AI API is running"}

@app.post("/parse-jd/", response_model=ParseJobResponse, tags=["JobDescription"])
async def parse_job_description(job_description: JobDescriptionRequest):
    try:
        parsed = jd_parser.parse_job_description(job_description.job_description_text)
        db.insert_job_description(parsed.to_dict())
        return {"job_id": parsed.job_id, "title": parsed.title, "company": parsed.company, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-jd/", response_model=ParseJobResponse, tags=["JobDescription"])
async def upload_job_description(job_description_file: UploadFile = File(...)):
    try:
        path = save_upload_file(job_description_file, JD_DIR)
        text = open(path, encoding="utf-8").read()
        parsed = jd_parser.parse_job_description(text)
        db.insert_job_description(parsed.to_dict())
        return {"job_id": parsed.job_id, "title": parsed.title, "company": parsed.company, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-resume/", response_model=ParseResumeResponse, tags=["Resume"])
async def parse_resume(resume_file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(resume_file.filename)[1]
        fname = f"{uuid.uuid4()}{ext}"
        path = save_upload_file(resume_file, RESUME_DIR, fname)
        parsed = resume_parser.parse_resume(path)
        db.insert_candidate(parsed.to_dict())
        return {"candidate_id": parsed.candidate_id, "name": parsed.name, "email": parsed.email, "skills": parsed.skills, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match/", response_model=MatchResponse, tags=["Matching"])
async def match_candidates(match_request: MatchRequest):
    try:
        job_dict = db.get_job_description(match_request.job_id)
        if not job_dict:
            raise HTTPException(status_code=404, detail="Job not found")
        job = dict_to_job_description(job_dict)
        cdicts = match_request.candidate_ids and [db.get_candidate(cid) for cid in match_request.candidate_ids] or db.get_all_candidates()
        cdicts = [c for c in cdicts if c]
        candidates = [dict_to_candidate_profile(c) for c in cdicts]
        results = []
        for cand in candidates:
            mr = matcher.match_candidate_to_job(cand, job)
            d = mr.to_dict()
            d.update({"job_id": job.job_id, "candidate_id": cand.candidate_id, "match_date": datetime.now().isoformat()})
            db.insert_match(d)
            results.append(d)
        return {"job_title": job.title, "company": job.company, "candidates_matched": len(results), "matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/shortlist/", response_model=ShortlistResponse, tags=["Shortlisting"])
async def shortlist_candidates(shortlist_request: ShortlistRequest):
    try:
        job_dict = db.get_job_description(shortlist_request.job_id)
        if not job_dict:
            raise HTTPException(status_code=404, detail="Job not found")
        matches = db.get_matches_for_job(shortlist_request.job_id)
        if not matches:
            return {"job_title": job_dict.get("title"), "company": job_dict.get("company"), "threshold_score": shortlist_request.threshold, "total_candidates": 0, "shortlisted_count": 0, "shortlisted_candidates": []}
        job = dict_to_job_description(job_dict)
        cids = [m["candidate_id"] for m in matches]
        cdicts = [db.get_candidate(cid) for cid in cids]
        cmap = {c["candidate_id"]: dict_to_candidate_profile(c) for c in cdicts if c}
        sr = shortlister.shortlist_candidates(job, matches, cmap, threshold=shortlist_request.threshold)
        # Update shortlist status in the matches table
        for match in matches:
            candidate_id = match["candidate_id"]
            is_shortlisted = candidate_id in sr.shortlisted_candidates
            db.update_shortlist_status(shortlist_request.job_id, candidate_id, is_shortlisted)
        
        return {"job_title": job.title, "company": job.company, "threshold_score": shortlist_request.threshold, "total_candidates": len(matches), "shortlisted_count": len(sr.shortlisted_candidates), "shortlisted_candidates": sr.shortlisted_candidates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schedule-emails/", response_model=EmailScheduleResponse, tags=["Email"])
async def schedule_emails(email_request: EmailRequest, background_tasks: BackgroundTasks):
    try:
        job_dict = db.get_job_description(email_request.job_id)
        if not job_dict:
            raise HTTPException(status_code=404, detail="Job not found")
        job = dict_to_job_description(job_dict)
        cdicts = [db.get_candidate(cid) for cid in email_request.candidate_ids]
        cdicts = [c for c in cdicts if c]
        candidates = [dict_to_candidate_profile(c) for c in cdicts]
        def task():
            for cand in candidates:
                er = email_scheduler.generate_email(cand, job, email_request.email_type, email_request.num_slots)
                ed = er.to_dict()
                ed.update({"job_id": job.job_id, "candidate_id": cand.candidate_id, "email_type": email_request.email_type, "scheduled_date": datetime.now().isoformat()})
                db.insert_email(ed)
        background_tasks.add_task(task)
        return {"message": "Email scheduling started", "job_title": job.title, "company": job.company, "email_type": email_request.email_type, "candidates": len(candidates), "status": "processing"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/", tags=["JobDescription"])
async def list_jobs():
    try:
        jobs = db.get_all_job_descriptions()
        return {"jobs": jobs, "count": len(jobs)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/{job_id}", tags=["JobDescription"])
async def get_job(job_id: str):
    try:
        job = db.get_job_description(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/candidates/", tags=["Candidate"])
async def list_candidates():
    try:
        cands = db.get_all_candidates()
        for c in cands:
            c.pop("resume_path", None)
        return {"candidates": cands, "count": len(cands)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/candidates/{candidate_id}", tags=["Candidate"])
async def get_candidate(candidate_id: str):
    try:
        cand = db.get_candidate(candidate_id)
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")
        cand.pop("resume_path", None)
        return cand
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/matches/{job_id}", tags=["Matching"])
async def get_matches_for_job(job_id: str):
    try:
        matches = db.get_matches_for_job(job_id)
        return {"job_id": job_id, "matches": matches, "count": len(matches)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/shortlists/{job_id}", tags=["Shortlisting"])
async def get_shortlist_for_job(job_id: str):
    try:
        shortlist = db.get_shortlisted_candidates(job_id)
        return shortlist or {"message": "No shortlist found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/jobs/{job_id}", tags=["JobDescription"])
async def delete_job(job_id: str):
    try:
        if not db.get_job_description(job_id):
            raise HTTPException(status_code=404, detail="Job not found")
        db.delete_job_description(job_id)
        return {"message": f"Job {job_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/candidates/{candidate_id}", tags=["Candidate"])
async def delete_candidate(candidate_id: str):
    try:
        cand = db.get_candidate(candidate_id)
        if not cand:
            raise HTTPException(status_code=404, detail="Candidate not found")
        path = cand.get("resume_path")
        db.delete_candidate(candidate_id)
        if path and os.path.exists(path): os.remove(path)
        return {"message": f"Candidate {candidate_id} deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
