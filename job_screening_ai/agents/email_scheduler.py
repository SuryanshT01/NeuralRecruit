import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional, Any, Union, Tuple
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import re
from dotenv import load_dotenv

# Import our models
from .resume_parser import CandidateProfile
from .jd_parser import JobDescription

# Load environment variables from .env file
load_dotenv()

class InterviewSlot(BaseModel):
    """Model for an interview time slot"""
    date: str  # YYYY-MM-DD format
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    
    def to_string(self) -> str:
        """Convert to readable string format"""
        return f"{self.date} from {self.start_time} to {self.end_time}"

class EmailTemplate(BaseModel):
    """Model for email templates"""
    subject: str
    body: str

class EmailResult(BaseModel):
    """Model for email sending result"""
    candidate_id: str
    job_id: str
    email_to: str
    success: bool
    message: str = ""
    sent_at: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return json.loads(self.json())

class EmailSchedulerAgent:
    """Agent for scheduling interviews and sending email invitations"""
    
    def __init__(self, 
                 smtp_server: str = "smtp.gmail.com", 
                 smtp_port: int = 587):
        # Get email credentials from environment variables
        self.email_user = os.getenv("EMAIL_USER", "")
        self.email_password = os.getenv("EMAIL_PASSWORD", "")
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        
        # Default templates
        self.templates = {
            "interview_invitation": EmailTemplate(
                subject="Interview Invitation for {job_title} at {company}",
                body="""
                Dear {candidate_name},
                
                We're pleased to inform you that your application for the {job_title} position at {company} has been shortlisted.
                
                We'd like to invite you for an interview. Please select one of the following time slots:
                
                {interview_slots}
                
                To confirm your interview, please reply to this email with your preferred slot.
                
                Best regards,
                HR Team
                {company}
                """
            ),
            "rejection": EmailTemplate(
                subject="Update on your application for {job_title} at {company}",
                body="""
                Dear {candidate_name},
                
                Thank you for your interest in the {job_title} position at {company} and for taking the time to apply.
                
                After careful consideration, we've decided to move forward with other candidates whose qualifications better match our current needs.
                
                We appreciate your interest in our company and wish you success in your job search.
                
                Best regards,
                HR Team
                {company}
                """
            )
        }
    
    def _validate_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _format_template(self, template: EmailTemplate, replacements: Dict[str, str]) -> EmailTemplate:
        """Format email template with replacements"""
        subject = template.subject
        body = template.body
        
        for key, value in replacements.items():
            subject = subject.replace(f"{{{key}}}", value)
            body = body.replace(f"{{{key}}}", value)
        
        return EmailTemplate(subject=subject, body=body)
    
    def _generate_interview_slots(self, num_slots: int = 3, start_days_from_now: int = 3) -> List[InterviewSlot]:
        """Generate interview time slots"""
        slots = []
        start_date = datetime.now() + timedelta(days=start_days_from_now)
        
        # Start on the next business day (skip weekends)
        while start_date.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
            start_date += timedelta(days=1)
        
        current_date = start_date
        
        for _ in range(num_slots):
            # Skip weekends
            while current_date.weekday() >= 5:
                current_date += timedelta(days=1)
            
            # Format as YYYY-MM-DD
            date_str = current_date.strftime("%Y-%m-%d")
            
            # Create morning and afternoon slots
            morning_slot = InterviewSlot(
                date=date_str,
                start_time="10:00",
                end_time="11:00"
            )
            
            afternoon_slot = InterviewSlot(
                date=date_str,
                start_time="14:00",
                end_time="15:00"
            )
            
            slots.append(morning_slot)
            slots.append(afternoon_slot)
            
            # Move to next day
            current_date += timedelta(days=1)
        
        # Take only the requested number of slots
        return slots[:num_slots]
    
    def _send_email(self, to_email: str, subject: str, body: str) -> Tuple[bool, str]:
        """Send email using SMTP"""
        if not self.email_user or not self.email_password:
            return False, "Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables."
        
        if not self._validate_email(to_email):
            return False, f"Invalid email address: {to_email}"
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Connect to server and send
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            server.send_message(msg)
            server.quit()
            
            return True, "Email sent successfully"
        except Exception as e:
            return False, f"Failed to send email: {str(e)}"
    
    def send_interview_invitation(self, 
                                  job: JobDescription, 
                                  candidate: CandidateProfile, 
                                  num_slots: int = 3) -> EmailResult:
        """Send interview invitation email to a candidate"""
        # Generate interview slots
        interview_slots = self._generate_interview_slots(num_slots)
        
        # Format slots as text
        slots_text = "\n".join([f"- {slot.to_string()}" for slot in interview_slots])
        
        # Prepare replacements for template
        replacements = {
            "candidate_name": candidate.name,
            "job_title": job.title,
            "company": job.company,
            "interview_slots": slots_text
        }
        
        # Format template
        template = self._format_template(self.templates["interview_invitation"], replacements)
        
        # Send email
        success, message = self._send_email(candidate.email, template.subject, template.body)
        
        # Create and return result
        result = EmailResult(
            candidate_id=candidate.candidate_id,
            job_id=job.job_id,
            email_to=candidate.email,
            success=success,
            message=message,
            sent_at=datetime.now().isoformat() if success else None
        )
        
        return result
    
    def send_rejection_email(self, job: JobDescription, candidate: CandidateProfile) -> EmailResult:
        """Send rejection email to a candidate"""
        # Prepare replacements for template
        replacements = {
            "candidate_name": candidate.name,
            "job_title": job.title,
            "company": job.company
        }
        
        # Format template
        template = self._format_template(self.templates["rejection"], replacements)
        
        # Send email
        success, message = self._send_email(candidate.email, template.subject, template.body)
        
        # Create and return result
        result = EmailResult(
            candidate_id=candidate.candidate_id,
            job_id=job.job_id,
            email_to=candidate.email,
            success=success,
            message=message,
            sent_at=datetime.now().isoformat() if success else None
        )
        
        return result
    
    def send_batch_interview_invitations(self, 
                                        job: JobDescription, 
                                        candidates: List[CandidateProfile], 
                                        num_slots: int = 3) -> List[EmailResult]:
        """Send interview invitations to multiple candidates"""
        results = []
        
        for candidate in candidates:
            result = self.send_interview_invitation(job, candidate, num_slots)
            results.append(result)
        
        return results
    
    def set_custom_template(self, template_type: str, subject: str, body: str) -> None:
        """Set a custom email template"""
        self.templates[template_type] = EmailTemplate(subject=subject, body=body)

# Example usage
if __name__ == "__main__":
    from jd_parser import JobDescription
    from resume_parser import CandidateProfile
    
    # Set up environment variables for testing
    os.environ["EMAIL_USER"] = "testuser@example.com"
    os.environ["EMAIL_PASSWORD"] = "testpassword"
    
    # Create sample job description
    job = JobDescription(
        job_id="JD-1234",
        title="Senior Python Developer",
        company="TechCorp",
        location="San Francisco, CA"
    )
    
    # Create sample candidate profile
    candidate = CandidateProfile(
        candidate_id="C-5678",
        name="John Smith",
        email="john.smith@example.com"
    )
    
    # Initialize email scheduler
    email_scheduler = EmailSchedulerAgent()
    
    # Preview email content
    interview_slots = email_scheduler._generate_interview_slots(3)
    slots_text = "\n".join([f"- {slot.to_string()}" for slot in interview_slots])
    
    replacements = {
        "candidate_name": candidate.name,
        "job_title": job.title,
        "company": job.company,
        "interview_slots": slots_text
    }
    
    template = email_scheduler._format_template(
        email_scheduler.templates["interview_invitation"], 
        replacements
    )
    
    print("Email Subject:")
    print(template.subject)
    print("\nEmail Body:")
    print(template.body)
    
    print("\nNote: Actual emails will not be sent in this example without valid credentials.")