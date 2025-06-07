import os
import json
import requests
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class JobRequirement(BaseModel):
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    experience: str = ""
    education: List[str] = Field(default_factory=list)

class JobDescription(BaseModel):
    job_id: Optional[str] = None
    title: str = ""
    company: str = ""
    location: str = ""
    job_type: str = ""
    description: str = ""
    responsibilities: List[str] = Field(default_factory=list)
    requirements: JobRequirement = Field(default_factory=JobRequirement)
    salary_range: str = ""
    posting_date: str = ""
    department: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return json.loads(self.json())

class JDParserAgent:
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.api_endpoint = f"{ollama_url}/api/generate"
        
    def _generate_prompt(self, job_description_text: str) -> str:
        """Generate a prompt for the LLM to extract structured data from a job description"""
        return f"""
        You are a specialized job description parser. Extract structured information from the following job description.
        Format the output as a valid JSON object with the following fields:
        - title: the job title
        - company: the company name
        - location: the job location
        - job_type: the employment type (Full-time, Part-time, Contract, etc.)
        - description: a summary of the job description
        - responsibilities: an array of key job responsibilities 
        - requirements: an object with:
            - required_skills: an array of required technical skills
            - preferred_skills: an array of preferred but not required skills
            - experience: years or level of experience required
            - education: an array of required education qualifications
        - salary_range: the salary range if mentioned
        - posting_date: the date the job was posted
        - department: the department or team

        JOB DESCRIPTION:
        {job_description_text}
        
        IMPORTANT: Return ONLY the valid JSON object without any additional text, explanation, or markdown formatting.
        """
    
    def parse_job_description(self, job_description_text: str) -> JobDescription:
        prompt = self._generate_prompt(job_description_text)
        resp = requests.post(self.api_endpoint, json={"model": "mistral", "prompt": prompt, "stream": False})
        if resp.status_code != 200:
            raise RuntimeError(f"Ollama error {resp.status_code}: {resp.text}")

        raw = resp.json().get("response", "")
        clean = self._clean_json_response(raw)
        try:
            data = json.loads(clean)
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON from LLM: {clean}")

        req = data.get("requirements", {})
        requirements = JobRequirement(
            required_skills=req.get("required_skills", []),
            preferred_skills=req.get("preferred_skills", []),
            experience=req.get("experience", ""),
            education=req.get("education", [])
        )

        return JobDescription(
            job_id=f"JD-{abs(hash(job_description_text)) % 10000}",
            title=data.get("title", ""),
            company=data.get("company", ""),
            location=data.get("location", ""),
            job_type=data.get("job_type", ""),
            description=data.get("description", ""),
            responsibilities=data.get("responsibilities", []),
            requirements=requirements,
            salary_range=data.get("salary_range", ""),
            posting_date=data.get("posting_date", ""),
            department=data.get("department", "")
        )

    def _clean_json_response(self, text: str) -> str:
        cleaned = text.replace("```json", "").replace("```", "").strip()
        start = cleaned.find("{")
        end = cleaned.rfind("}") + 1
        return cleaned[start:end] if start >= 0 and end > start else cleaned

# Example usage
if __name__ == "__main__":
    sample_jd = """
    Senior Python Developer
    
    About Us:
    TechCorp is a leading software development company based in San Francisco, CA.
    
    Job Description:
    We are looking for a Senior Python Developer to join our dynamic team. The ideal candidate will have extensive experience in Python development and a strong understanding of web frameworks.
    
    Responsibilities:
    - Design and implement high-quality Python code
    - Develop backend components and APIs
    - Integrate user-facing elements with server-side logic
    - Improve code quality through writing unit tests
    - Collaborate with cross-functional teams
    
    Requirements:
    - 5+ years of experience in Python development
    - Strong knowledge of Python web frameworks (Django, Flask)
    - Experience with database design and ORM
    - Understanding of server-side templating languages
    - Familiarity with frontend technologies (HTML, CSS, JavaScript)
    
    Preferred Skills:
    - Experience with Docker and Kubernetes
    - Knowledge of AWS services
    - Familiarity with CI/CD pipelines
    
    Education:
    - Bachelor's degree in Computer Science or related field
    
    Job Type: Full-time
    Salary Range: $120,000 - $150,000 per year
    Department: Engineering
    Posting Date: 2023-09-15
    """
    
    parser = JDParserAgent()
    parsed_jd = parser.parse_job_description(sample_jd)
    print(json.dumps(parsed_jd.to_dict(), indent=2))