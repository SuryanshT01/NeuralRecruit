import json
import requests
from typing import Dict, List, Optional, Any, Tuple
from pydantic import BaseModel, Field
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import string
import numpy as np
import os

# Import our models
from .jd_parser import JobDescription, JobRequirement
from .resume_parser import CandidateProfile

# Download NLTK resources (if not already downloaded)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('wordnet')

class MatchResult(BaseModel):
    """Model for the result of a candidate-job matching process"""
    job_id: str
    candidate_id: str
    overall_match_score: float  # 0-100%
    skill_match_score: float
    experience_match_score: float
    education_match_score: float
    match_details: Dict[str, Any] = Field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return json.loads(self.json())

class MatcherAgent:
    """Agent for matching candidates to job descriptions"""
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.api_endpoint = f"{ollama_url}/api/generate"
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
    
    def _preprocess_text(self, text: str) -> List[str]:
        """Preprocess text by tokenizing, removing stopwords, and lemmatizing"""
        # Convert to lowercase
        text = text.lower()
        # Tokenize
        tokens = word_tokenize(text)
        # Remove punctuation and stopwords
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens 
                  if token not in string.punctuation and token not in self.stop_words]
        return tokens
    
    def _calculate_skill_match(self, job_skills: List[str], candidate_skills: List[str]) -> Tuple[float, List[str]]:
        """Calculate skill match score and identify matched skills"""
        if not job_skills:
            return 100.0, []  # If no skills specified in job, consider it a full match
        
        # Preprocess all skills
        preprocessed_job_skills = [self._preprocess_text(skill) for skill in job_skills]
        preprocessed_candidate_skills = [self._preprocess_text(skill) for skill in candidate_skills]
        
        # Flatten the lists of tokens
        job_skill_tokens = [token for tokens in preprocessed_job_skills for token in tokens]
        candidate_skill_tokens = [token for tokens in preprocessed_candidate_skills for token in tokens]
        
        # Count matches
        matched_skills = []
        for job_skill in job_skills:
            job_skill_tokens = self._preprocess_text(job_skill)
            
            # Consider it a match if any of the candidate's skills contain all tokens of the job skill
            for candidate_skill in candidate_skills:
                candidate_skill_tokens = self._preprocess_text(candidate_skill)
                
                # If all job skill tokens are in the candidate skill tokens, or vice versa
                if all(token in candidate_skill_tokens for token in job_skill_tokens) or \
                   all(token in job_skill_tokens for token in candidate_skill_tokens):
                    matched_skills.append(job_skill)
                    break
        
        # Calculate score
        match_score = (len(matched_skills) / len(job_skills)) * 100 if job_skills else 100.0
        return match_score, matched_skills
    
    def _calculate_experience_match(self, required_experience: str, candidate_experiences: List[Dict[str, str]]) -> float:
        """Calculate experience match score based on years of experience"""
        if not required_experience:
            return 100.0  # If no experience requirement, consider it a full match
        
        # Extract years from required experience string
        import re
        years_pattern = r'(\d+)[\+]?\s*(?:years?|yrs?)'
        required_years_match = re.search(years_pattern, required_experience.lower())
        if not required_years_match:
            return 80.0  # If we can't parse the required years, give a default score
        
        required_years = int(required_years_match.group(1))
        
        # Calculate total years from candidate experiences
        total_candidate_years = 0
        for exp in candidate_experiences:
            duration = exp.get("duration", "")
            years_match = re.search(years_pattern, duration.lower())
            if years_match:
                total_candidate_years += int(years_match.group(1))
            else:
                # Try to calculate from start and end dates
                start = exp.get("start_date", "")
                end = exp.get("end_date", "").lower()
                
                # Extract years from dates
                start_year_match = re.search(r'(\d{4})', start)
                end_year_match = re.search(r'(\d{4})', end) if "present" not in end else None
                
                if start_year_match:
                    start_year = int(start_year_match.group(1))
                    end_year = int(end_year_match.group(1)) if end_year_match else 2023  # Use current year if "present"
                    total_candidate_years += (end_year - start_year)
        
        # Calculate score
        if total_candidate_years >= required_years:
            return 100.0
        elif total_candidate_years >= required_years * 0.8:
            return 90.0
        elif total_candidate_years >= required_years * 0.6:
            return 70.0
        elif total_candidate_years >= required_years * 0.4:
            return 50.0
        else:
            return 30.0
    
    def _calculate_education_match(self, required_education: List[str], candidate_education: List[Dict[str, str]]) -> float:
        """Calculate education match score"""
        if not required_education:
            return 100.0  # If no education requirement, consider it a full match
        
        # Education level hierarchy
        education_levels = {
            "high school": 1,
            "associate": 2,
            "bachelor": 3,
            "master": 4,
            "phd": 5,
            "doctorate": 5
        }
        
        # Extract required education level
        required_level = 0
        for edu in required_education:
            edu_lower = edu.lower()
            for level, value in education_levels.items():
                if level in edu_lower:
                    required_level = max(required_level, value)
        
        # If no specific level found, default to bachelor's
        if required_level == 0:
            required_level = 3
        
        # Extract candidate's highest education level
        candidate_level = 0
        for edu in candidate_education:
            degree = edu.get("degree", "").lower()
            for level, value in education_levels.items():
                if level in degree:
                    candidate_level = max(candidate_level, value)
        
        # Calculate score
        if candidate_level >= required_level:
            return 100.0
        elif candidate_level == required_level - 1:
            return 80.0
        elif candidate_level == required_level - 2:
            return 60.0
        else:
            return 40.0
    
    def _use_llm_for_final_evaluation(self, job: JobDescription, candidate: CandidateProfile, 
                                      skill_score: float, experience_score: float, education_score: float) -> float:
        """Use LLM to make a final evaluation and adjustment to the match score"""
        prompt = f"""
        You are an expert HR professional evaluating a candidate for a job position.
        Please analyze the match between the candidate and job description, and provide a final match score (0-100).
        
        Job Description:
        - Title: {job.title}
        - Company: {job.company}
        - Required Skills: {', '.join(job.requirements.required_skills)}
        - Preferred Skills: {', '.join(job.requirements.preferred_skills)}
        - Required Experience: {job.requirements.experience}
        - Required Education: {', '.join(job.requirements.education)}
        
        Candidate Profile:
        - Name: {candidate.name}
        - Skills: {', '.join(candidate.skills)}
        - Experience: {len(candidate.experience)} positions, with titles including {', '.join([exp.title for exp in candidate.experience])}
        - Education: {', '.join([f"{edu.degree} in {edu.field_of_study} from {edu.institution}" for edu in candidate.education])}
        
        Preliminary Scores:
        - Skill Match: {skill_score:.1f}%
        - Experience Match: {experience_score:.1f}%
        - Education Match: {education_score:.1f}%
        
        Based on your expert analysis, provide a single overall match score as a percentage (0-100).
        Just return the number without any explanation or additional text.
        """
        
        try:
            response = requests.post(
                self.api_endpoint,
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                # Extract the generated text from Ollama response
                generated_text = response.json().get("response", "").strip()
                
                # Try to extract just the number
                import re
                match = re.search(r'(\d+\.?\d*)', generated_text)
                if match:
                    score = float(match.group(1))
                    # Ensure the score is within valid range
                    return max(0.0, min(100.0, score))
            
            # If anything goes wrong, fallback to weighted average
            return self._calculate_weighted_average(skill_score, experience_score, education_score)
                
        except Exception as e:
            print(f"Error using LLM for final evaluation: {str(e)}")
            # Fallback to weighted average
            return self._calculate_weighted_average(skill_score, experience_score, education_score)
    
    def _calculate_weighted_average(self, skill_score: float, experience_score: float, education_score: float) -> float:
        """Calculate weighted average of the scores"""
        # Weights: Skills (50%), Experience (30%), Education (20%)
        return (skill_score * 0.5) + (experience_score * 0.3) + (education_score * 0.2)
    
    def match_candidate_to_job(self, job: JobDescription, candidate: CandidateProfile) -> MatchResult:
        """Match a candidate profile to a job description and return a score"""
        # Calculate skill match
        required_skills = job.requirements.required_skills
        preferred_skills = job.requirements.preferred_skills
        all_job_skills = required_skills + preferred_skills
        candidate_skills = candidate.skills
        
        skill_score, matched_skills = self._calculate_skill_match(all_job_skills, candidate_skills)
        
        # Calculate experience match
        required_experience = job.requirements.experience
        candidate_experiences = [exp.dict() for exp in candidate.experience]
        experience_score = self._calculate_experience_match(required_experience, candidate_experiences)
        
        # Calculate education match
        required_education = job.requirements.education
        candidate_education = [edu.dict() for edu in candidate.education]
        education_score = self._calculate_education_match(required_education, candidate_education)
        
        # Calculate overall match score
        # Option 1: Simple weighted average
        # overall_score = self._calculate_weighted_average(skill_score, experience_score, education_score)
        
        # Option 2: Use LLM for final evaluation
        overall_score = self._use_llm_for_final_evaluation(
            job, candidate, skill_score, experience_score, education_score
        )
        
        # Create match details
        match_details = {
            "matched_skills": matched_skills,
            "missing_skills": [skill for skill in all_job_skills if skill not in matched_skills],
            "skill_match_percentage": skill_score,
            "experience_match_percentage": experience_score,
            "education_match_percentage": education_score
        }
        
        # Create and return MatchResult
        result = MatchResult(
            job_id=job.job_id,
            candidate_id=candidate.candidate_id,
            overall_match_score=overall_score,
            skill_match_score=skill_score,
            experience_match_score=experience_score,
            education_match_score=education_score,
    match_details=match_details
)
        
        return result

# Example usage
if __name__ == "__main__":
    from jd_parser import JobDescription, JobRequirement
    from resume_parser import CandidateProfile, CandidateExperience, CandidateEducation
    
    # Create sample job description
    job_req = JobRequirement(
        required_skills=["Python", "Django", "PostgreSQL"],
        preferred_skills=["Docker", "AWS", "REST API"],
        experience="5+ years",
        education=["Bachelor's degree in Computer Science"]
    )
    
    job = JobDescription(
        job_id="JD-1234",
        title="Senior Python Developer",
        company="TechCorp",
        location="San Francisco, CA",
        job_type="Full-time",
        description="We are looking for a Senior Python Developer...",
        responsibilities=["Design and implement code", "Develop backend components"],
        requirements=job_req,
        salary_range="$120,000 - $150,000 per year",
        posting_date="2023-09-15",
        department="Engineering"
    )
    
    # Create sample candidate profile
    exp1 = CandidateExperience(
        company="TechCorp Inc.",
        title="Senior Software Engineer",
        duration="3 years",
        description="Led development of microservices architecture...",
        start_date="03/2020",
        end_date="Present"
    )
    
    exp2 = CandidateExperience(
        company="WebSolutions LLC",
        title="Software Engineer",
        duration="4 years",
        description="Developed web applications using Django and React...",
        start_date="06/2016",
        end_date="02/2020"
    )
    
    edu = CandidateEducation(
        institution="University of California, Berkeley",
        degree="Bachelor of Science",
        field_of_study="Computer Science",
        graduation_date="2016"
    )
    
    candidate = CandidateProfile(
        candidate_id="C-5678",
        name="John Smith",
        email="john.smith@example.com",
        phone="(123) 456-7890",
        location="San Francisco, CA",
        linkedin="linkedin.com/in/johnsmith",
        summary="Experienced software engineer with 8 years of expertise...",
        skills=["Python", "Django", "React", "AWS", "Docker", "PostgreSQL"],
        experience=[exp1, exp2],
        education=[edu],
        certifications=["AWS Certified Developer - Associate", "Certified Scrum Master"],
        languages=["English", "Spanish"]
    )
    
    # Match candidate to job
    matcher = MatcherAgent()
    match_result = matcher.match_candidate_to_job(job, candidate)
    print(json.dumps(match_result.to_dict(), indent=2))