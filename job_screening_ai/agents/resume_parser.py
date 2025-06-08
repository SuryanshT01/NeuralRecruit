import os
import json
import requests
import fitz  # PyMuPDF
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, EmailStr
import re

class CandidateExperience(BaseModel):
    """Model for candidate work experience"""
    company: str = ""
    title: str = ""
    duration: str = ""
    description: str = ""
    start_date: str = ""
    end_date: str = ""

class CandidateEducation(BaseModel):
    """Model for candidate education"""
    institution: str = ""
    degree: str = ""
    field_of_study: str = ""
    graduation_date: str = ""
    
class CandidateProfile(BaseModel):
    """Model for parsed resume data"""
    candidate_id: Optional[str] = None
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    summary: str = ""
    skills: List[str] = Field(default_factory=list)
    experience: List[CandidateExperience] = Field(default_factory=list)
    education: List[CandidateEducation] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return json.loads(self.json())

class ResumeParserAgent:
    """Agent for parsing resumes using Ollama LLM"""
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        self.ollama_url = ollama_url
        self.api_endpoint = f"{ollama_url}/api/generate"
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text content from a PDF file"""
        try:
            document = fitz.open(pdf_path)
            text = ""
            for page in document:
                text += page.get_text()
            return text
        except Exception as e:
            print(f"Error extracting text from PDF: {str(e)}")
            return ""
    
    def _generate_prompt(self, resume_text: str) -> str:
        """Generate a prompt for the LLM to extract structured data from a resume"""
        return f"""
        You are a specialized resume parser. Extract structured information from the following resume.
        Format the output as a valid JSON object with the following fields:
        - name: the candidate's full name
        - email: the candidate's email address
        - phone: the candidate's phone number
        - location: the candidate's location/address
        - linkedin: the candidate's LinkedIn URL if available
        - summary: a brief summary or objective from the resume
        - skills: an array of technical and soft skills mentioned
        - experience: an array of work experiences, each containing:
            - company: company name
            - title: job title
            - duration: how long they worked there
            - description: brief description of responsibilities
            - start_date: when they started (MM/YYYY format if possible)
            - end_date: when they ended (MM/YYYY format or "Present")
        - education: an array of educational backgrounds, each containing:
            - institution: school/university name
            - degree: type of degree
            - field_of_study: major or concentration
            - graduation_date: when they graduated (YYYY format)
        - certifications: an array of professional certifications
        - languages: an array of languages they know

        RESUME TEXT:
        {resume_text}
        
        IMPORTANT: Return ONLY the valid JSON object without any additional text, explanation, or markdown formatting.
        """
    
    def parse_resume(self, resume_path: str) -> CandidateProfile:
        """Parse resume file using Ollama LLM"""
        # Extract text from PDF if it's a PDF file
        if resume_path.lower().endswith('.pdf'):
            resume_text = self.extract_text_from_pdf(resume_path)
        else:
            # Assume it's a text file
            try:
                with open(resume_path, 'r', encoding='utf-8') as f:
                    resume_text = f.read()
            except Exception as e:
                print(f"Error reading file: {str(e)}")
                return CandidateProfile()
        
        # Generate prompt for LLM
        prompt = self._generate_prompt(resume_text)
        
        try:
            # Send request to Ollama API
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
                generated_text = response.json().get("response", "")
                
                # Clean up the generated text to ensure it's valid JSON
                json_text = self._clean_json_response(generated_text)
                
                # Parse JSON into structured data
                parsed_data = json.loads(json_text)
                
                # Create experience objects
                experiences = []
                for exp_data in parsed_data.get("experience", []):
                    experience = CandidateExperience(
                        company=exp_data.get("company", ""),
                        title=exp_data.get("title", ""),
                        duration=exp_data.get("duration", ""),
                        description=exp_data.get("description", ""),
                        start_date=exp_data.get("start_date", ""),
                        end_date=exp_data.get("end_date", "")
                    )
                    experiences.append(experience)
                
                # Create education objects
                educations = []
                
                def safe_get_str(data, key):
                    val = data.get(key, "")
                    if isinstance(val, list):
                        return ", ".join(val)
                    if isinstance(val, str):
                        return val
                    return ""

                for edu_data in parsed_data.get("education", []):
                    education = CandidateEducation(
                        institution=safe_get_str(edu_data, "institution"),
                        degree=safe_get_str(edu_data, "degree"),
                        field_of_study=safe_get_str(edu_data, "field_of_study"),
                        graduation_date=safe_get_str(edu_data, "graduation_date")
                    )
                    educations.append(education)

                
                # Create and return CandidateProfile object
                candidate_id = f"C-{abs(hash(resume_text)) % 10**8}"
                def safe_str(value):
                    return value if isinstance(value, str) else ""

                def safe_list(value):
                    return value if isinstance(value, list) else []

                profile = CandidateProfile(
                    candidate_id=candidate_id,
                    name=safe_str(parsed_data.get("name")),
                    email=safe_str(parsed_data.get("email")),
                    phone=safe_str(parsed_data.get("phone")),
                    location=safe_str(parsed_data.get("location")),
                    linkedin=safe_str(parsed_data.get("linkedin")),
                    summary=safe_str(parsed_data.get("summary")),
                    skills=safe_list(parsed_data.get("skills")),
                    experience=experiences,
                    education=educations,
                    certifications=safe_list(parsed_data.get("certifications")),
                    languages=safe_list(parsed_data.get("languages"))
                )

                return profile
            else:
                print(f"Error: Ollama API returned status code {response.status_code}")
                return CandidateProfile(
                    candidate_id="unknown",
                    name="",
                    email="",
                    phone="",
                    location="",
                    linkedin="",
                    summary="",
                    skills=[],
                    experience=[],
                    education=[],
                    certifications=[],
                    languages=[]
                )

                
        except Exception as e:
            print(f"Error parsing resume: {str(e)}")
            return CandidateProfile()
    
    def _clean_json_response(self, text: str) -> str:
        """Clean up JSON response from LLM to ensure it's valid"""
        # Remove markdown code block indicators if present
        text = text.replace("```json", "").replace("```", "").strip()
        
        # Find the first { and last } to extract just the JSON part
        start = text.find("{")
        end = text.rfind("}") + 1
        
        if start != -1 and end != 0:
            return text[start:end]
        return text

# Example usage
if __name__ == "__main__":
    # Create a sample text resume for testing
    sample_resume = """
    JOHN SMITH
    Software Engineer
    
    Contact Information:
    Email: john.smith@example.com
    Phone: (123) 456-7890
    Location: San Francisco, CA
    LinkedIn: linkedin.com/in/johnsmith
    
    SUMMARY
    Experienced software engineer with 8 years of expertise in Python development, 
    web frameworks, and cloud technologies. Passionate about building scalable 
    applications and improving development processes.
    
    SKILLS
    - Python, JavaScript, TypeScript
    - Django, Flask, FastAPI
    - React, Angular
    - AWS, Docker, Kubernetes
    - SQL, PostgreSQL, MongoDB
    - CI/CD, Jenkins, GitHub Actions
    
    WORK EXPERIENCE
    
    Senior Software Engineer | TechCorp Inc.
    03/2020 - Present
    - Led the development of a microservices architecture that improved system reliability by 40%
    - Implemented automated testing pipelines that reduced deployment time by 60%
    - Mentored junior developers and conducted code reviews
    - Designed and developed RESTful APIs serving over 1M requests daily
    
    Software Engineer | WebSolutions LLC
    06/2016 - 02/2020
    - Developed and maintained web applications using Django and React
    - Optimized database queries resulting in 30% faster page load times
    - Collaborated with UX designers to implement responsive web designs
    - Participated in agile development processes and sprint planning
    
    EDUCATION
    
    University of California, Berkeley
    Bachelor of Science in Computer Science
    Graduation: 2016
    
    CERTIFICATIONS
    - AWS Certified Developer - Associate
    - Certified Scrum Master
    
    LANGUAGES
    - English (Native)
    - Spanish (Intermediate)
    """
    
    # Write the sample resume to a temporary file
    with open("sample_resume.txt", "w") as f:
        f.write(sample_resume)
    
    # Parse the resume
    parser = ResumeParserAgent()
    parsed_resume = parser.parse_resume("sample_resume.txt")
    print(json.dumps(parsed_resume.to_dict(), indent=2))
    
    # Clean up
    os.remove("sample_resume.txt")