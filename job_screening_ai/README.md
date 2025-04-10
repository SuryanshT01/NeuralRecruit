# Job Screening AI

An AI-powered job screening system built with FastAPI, Ollama, and SQLite.

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt

2. Set Up Environment Variables Create a .env file with:

    EMAIL_USER=your_email@gmail.com
    EMAIL_PASSWORD=your_app_specific_password

3. Install and Run Ollama
    curl -fsSL https://ollama.com/install.sh | sh
    ollama pull mistral
    ollama serve

4. Run the API
    uvicorn api.main:app --reload

5. Test the API Visit http://127.0.0.1:8000/docs in your browser.

    Endpoints
    POST /parse-jd/: Parse a job description
    POST /parse-resume/: Parse a resume file
    POST /match/: Match candidates to a job
    POST /shortlist/: Shortlist candidates
    POST /schedule-interview/: Send interview invites

