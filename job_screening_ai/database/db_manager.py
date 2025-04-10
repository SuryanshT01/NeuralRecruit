# job_screening_ai/database/db_manager.py

import os
import sqlite3
import json
from typing import List, Dict, Any, Optional, Tuple
import datetime

class DatabaseManager:
    """Manager for the SQLite database operations"""
    
    def __init__(self, db_path: str = "job_screening.db"):
        """Initialize database connection and create tables if they don't exist"""
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self._connect()
        self._create_tables()
    
    def _connect(self):
        """Connect to the SQLite database"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row  # Return rows as dictionaries
            self.cursor = self.conn.cursor()
        except sqlite3.Error as e:
            print(f"Database connection error: {e}")
    
    def _create_tables(self):
        """Create necessary tables if they don't exist"""
        try:
            # Job Descriptions table
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS job_descriptions (
                job_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                job_type TEXT,
                description TEXT,
                responsibilities TEXT,
                requirements TEXT,
                salary_range TEXT,
                posting_date TEXT,
                department TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Candidates table
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS candidates (
                candidate_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                location TEXT,
                linkedin TEXT,
                summary TEXT,
                skills TEXT,
                experience TEXT,
                education TEXT,
                certifications TEXT,
                languages TEXT,
                resume_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Matches table
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                match_id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                candidate_id TEXT NOT NULL,
                overall_match_score REAL NOT NULL,
                skill_match_score REAL NOT NULL,
                experience_match_score REAL NOT NULL,
                education_match_score REAL NOT NULL,
                match_details TEXT,
                is_shortlisted INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES job_descriptions (job_id),
                FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id),
                UNIQUE(job_id, candidate_id)
            )
            ''')
            
            # Emails table
            self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS emails (
                email_id INTEGER PRIMARY KEY AUTOINCREMENT,
                candidate_id TEXT NOT NULL,
                job_id TEXT NOT NULL,
                email_to TEXT NOT NULL,
                email_type TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                success INTEGER DEFAULT 0,
                message TEXT,
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES job_descriptions (job_id),
                FOREIGN KEY (candidate_id) REFERENCES candidates (candidate_id)
            )
            ''')
            
            self.conn.commit()
        except sqlite3.Error as e:
            print(f"Error creating tables: {e}")
    
    def close(self):
        """Close the database connection"""
        if self.conn:
            self.conn.close()
    
    # Job Description operations
    def insert_job_description(self, job_data: Dict[str, Any]) -> bool:
        """Insert a job description into the database"""
        try:
            # Convert list and dict fields to JSON strings
            if 'responsibilities' in job_data and isinstance(job_data['responsibilities'], list):
                job_data['responsibilities'] = json.dumps(job_data['responsibilities'])
            
            if 'requirements' in job_data:
                if isinstance(job_data['requirements'], dict):
                    job_data['requirements'] = json.dumps(job_data['requirements'])
            
            query = '''
            INSERT INTO job_descriptions (
                job_id, title, company, location, job_type, description, 
                responsibilities, requirements, salary_range, 
                posting_date, department
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            self.cursor.execute(query, (
                job_data.get('job_id'),
                job_data.get('title', ''),
                job_data.get('company', ''),
                job_data.get('location', ''),
                job_data.get('job_type', ''),
                job_data.get('description', ''),
                job_data.get('responsibilities', ''),
                job_data.get('requirements', ''),
                job_data.get('salary_range', ''),
                job_data.get('posting_date', ''),
                job_data.get('department', '')
            ))
            
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error inserting job description: {e}")
            return False
    
    def get_job_description(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job description by ID"""
        try:
            query = "SELECT * FROM job_descriptions WHERE job_id = ?"
            self.cursor.execute(query, (job_id,))
            row = self.cursor.fetchone()
            
            if not row:
                return None
            
            job_dict = dict(row)
            
            # Convert JSON strings back to Python objects
            if job_dict.get('responsibilities'):
                try:
                    job_dict['responsibilities'] = json.loads(job_dict['responsibilities'])
                except json.JSONDecodeError:
                    job_dict['responsibilities'] = []
            
            if job_dict.get('requirements'):
                try:
                    job_dict['requirements'] = json.loads(job_dict['requirements'])
                except json.JSONDecodeError:
                    job_dict['requirements'] = {}
            
            return job_dict
        except sqlite3.Error as e:
            print(f"Error getting job description: {e}")
            return None
    
    def get_all_job_descriptions(self) -> List[Dict[str, Any]]:
        """Get all job descriptions"""
        try:
            query = "SELECT * FROM job_descriptions ORDER BY created_at DESC"
            self.cursor.execute(query)
            rows = self.cursor.fetchall()
            
            job_list = []
            for row in rows:
                job_dict = dict(row)
                
                # Convert JSON strings back to Python objects
                if job_dict.get('responsibilities'):
                    try:
                        job_dict['responsibilities'] = json.loads(job_dict['responsibilities'])
                    except json.JSONDecodeError:
                        job_dict['responsibilities'] = []
                
                if job_dict.get('requirements'):
                    try:
                        job_dict['requirements'] = json.loads(job_dict['requirements'])
                    except json.JSONDecodeError:
                        job_dict['requirements'] = {}
                
                job_list.append(job_dict)
            
            return job_list
        except sqlite3.Error as e:
            print(f"Error getting all job descriptions: {e}")
            return []
    
    # Candidate operations
    def insert_candidate(self, candidate_data: Dict[str, Any]) -> bool:
        """Insert a candidate into the database"""
        try:
            # Convert list and dict fields to JSON strings
            if 'skills' in candidate_data and isinstance(candidate_data['skills'], list):
                candidate_data['skills'] = json.dumps(candidate_data['skills'])
            
            if 'experience' in candidate_data and isinstance(candidate_data['experience'], list):
                candidate_data['experience'] = json.dumps(candidate_data['experience'])
            
            if 'education' in candidate_data and isinstance(candidate_data['education'], list):
                candidate_data['education'] = json.dumps(candidate_data['education'])
            
            if 'certifications' in candidate_data and isinstance(candidate_data['certifications'], list):
                candidate_data['certifications'] = json.dumps(candidate_data['certifications'])
            
            if 'languages' in candidate_data and isinstance(candidate_data['languages'], list):
                candidate_data['languages'] = json.dumps(candidate_data['languages'])
            
            query = '''
            INSERT INTO candidates (
                candidate_id, name, email, phone, location, linkedin, summary,
                skills, experience, education, certifications, languages, resume_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            self.cursor.execute(query, (
                candidate_data.get('candidate_id'),
                candidate_data.get('name', ''),
                candidate_data.get('email', ''),
                candidate_data.get('phone', ''),
                candidate_data.get('location', ''),
                candidate_data.get('linkedin', ''),
                candidate_data.get('summary', ''),
                candidate_data.get('skills', ''),
                candidate_data.get('experience', ''),
                candidate_data.get('education', ''),
                candidate_data.get('certifications', ''),
                candidate_data.get('languages', ''),
                candidate_data.get('resume_path', '')
            ))
            
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error inserting candidate: {e}")
            return False
    
    def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        """Get a candidate by ID"""
        try:
            query = "SELECT * FROM candidates WHERE candidate_id = ?"
            self.cursor.execute(query, (candidate_id,))
            row = self.cursor.fetchone()
            
            if not row:
                return None
            
            candidate_dict = dict(row)
            
            # Convert JSON strings back to Python objects
            for field in ['skills', 'experience', 'education', 'certifications', 'languages']:
                if candidate_dict.get(field):
                    try:
                        candidate_dict[field] = json.loads(candidate_dict[field])
                    except json.JSONDecodeError:
                        candidate_dict[field] = []
            
            return candidate_dict
        except sqlite3.Error as e:
            print(f"Error getting candidate: {e}")
            return None
    
    def get_all_candidates(self) -> List[Dict[str, Any]]:
        """Get all candidates"""
        try:
            query = "SELECT * FROM candidates ORDER BY created_at DESC"
            self.cursor.execute(query)
            rows = self.cursor.fetchall()
            
            candidate_list = []
            for row in rows:
                candidate_dict = dict(row)
                
                # Convert JSON strings back to Python objects
                for field in ['skills', 'experience', 'education', 'certifications', 'languages']:
                    if candidate_dict.get(field):
                        try:
                            candidate_dict[field] = json.loads(candidate_dict[field])
                        except json.JSONDecodeError:
                            candidate_dict[field] = []
                
                candidate_list.append(candidate_dict)
            
            return candidate_list
        except sqlite3.Error as e:
            print(f"Error getting all candidates: {e}")
            return []
    
    # Match operations
    def insert_match(self, match_data: Dict[str, Any]) -> bool:
        """Insert a match result into the database"""
        try:
            # Convert match details to JSON string
            if 'match_details' in match_data and isinstance(match_data['match_details'], dict):
                match_data['match_details'] = json.dumps(match_data['match_details'])
            
            query = '''
            INSERT OR REPLACE INTO matches (
                job_id, candidate_id, overall_match_score, 
                skill_match_score, experience_match_score, education_match_score,
                match_details, is_shortlisted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            self.cursor.execute(query, (
                match_data.get('job_id'),
                match_data.get('candidate_id'),
                match_data.get('overall_match_score', 0.0),
                match_data.get('skill_match_score', 0.0),
                match_data.get('experience_match_score', 0.0),
                match_data.get('education_match_score', 0.0),
                match_data.get('match_details', ''),
                match_data.get('is_shortlisted', 0)
            ))
            
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error inserting match: {e}")
            return False
    
    def update_shortlist_status(self, job_id: str, candidate_id: str, is_shortlisted: bool) -> bool:
        """Update the shortlist status of a match"""
        try:
            query = '''
            UPDATE matches 
            SET is_shortlisted = ? 
            WHERE job_id = ? AND candidate_id = ?
            '''
            
            self.cursor.execute(query, (
                1 if is_shortlisted else 0,
                job_id,
                candidate_id
            ))
            
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error updating shortlist status: {e}")
            return False
    
    def get_matches_for_job(self, job_id: str) -> List[Dict[str, Any]]:
        """Get all matches for a specific job"""
        try:
            query = """
            SELECT m.*, c.name as candidate_name, c.email as candidate_email 
            FROM matches m
            JOIN candidates c ON m.candidate_id = c.candidate_id
            WHERE m.job_id = ?
            ORDER BY m.overall_match_score DESC
            """
            self.cursor.execute(query, (job_id,))
            rows = self.cursor.fetchall()
            
            match_list = []
            for row in rows:
                match_dict = dict(row)
                
                # Convert match details from JSON string to dict
                if match_dict.get('match_details'):
                    try:
                        match_dict['match_details'] = json.loads(match_dict['match_details'])
                    except json.JSONDecodeError:
                        match_dict['match_details'] = {}
                
                match_list.append(match_dict)
            
            return match_list
        except sqlite3.Error as e:
            print(f"Error getting matches for job: {e}")
            return []
    
    def get_shortlisted_candidates(self, job_id: str) -> List[Dict[str, Any]]:
        """Get all shortlisted candidates for a specific job"""
        try:
            query = """
            SELECT c.*, m.overall_match_score, m.skill_match_score, 
                   m.experience_match_score, m.education_match_score
            FROM matches m
            JOIN candidates c ON m.candidate_id = c.candidate_id
            WHERE m.job_id = ? AND m.is_shortlisted = 1
            ORDER BY m.overall_match_score DESC
            """
            self.cursor.execute(query, (job_id,))
            rows = self.cursor.fetchall()
            
            candidate_list = []
            for row in rows:
                candidate_dict = dict(row)
                
                # Convert JSON strings back to Python objects
                for field in ['skills', 'experience', 'education', 'certifications', 'languages']:
                    if candidate_dict.get(field):
                        try:
                            candidate_dict[field] = json.loads(candidate_dict[field])
                        except json.JSONDecodeError:
                            candidate_dict[field] = []
                
                candidate_list.append(candidate_dict)
            
            return candidate_list
        except sqlite3.Error as e:
            print(f"Error getting shortlisted candidates: {e}")
            return []
    
    # Email operations
    def insert_email(self, email_data: Dict[str, Any]) -> bool:
        """Insert an email record into the database"""
        try:
            query = '''
            INSERT INTO emails (
                candidate_id, job_id, email_to, email_type,
                subject, body, success, message, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            '''
            
            sent_at = email_data.get('sent_at')
            if sent_at and not isinstance(sent_at, str):
                sent_at = sent_at.isoformat()
            
            self.cursor.execute(query, (
                email_data.get('candidate_id'),
                email_data.get('job_id'),
                email_data.get('email_to', ''),
                email_data.get('email_type', ''),
                email_data.get('subject', ''),
                email_data.get('body', ''),
                1 if email_data.get('success', False) else 0,
                email_data.get('message', ''),
                sent_at
            ))
            
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"Error inserting email: {e}")
            return False
    
    def get_emails_for_candidate(self, candidate_id: str, job_id: str = None) -> List[Dict[str, Any]]:
        """Get all emails sent to a specific candidate"""
        try:
            if job_id:
                query = """
                SELECT * FROM emails 
                WHERE candidate_id = ? AND job_id = ?
                ORDER BY created_at DESC
                """
                self.cursor.execute(query, (candidate_id, job_id))
            else:
                query = """
                SELECT * FROM emails 
                WHERE candidate_id = ?
                ORDER BY created_at DESC
                """
                self.cursor.execute(query, (candidate_id,))
                
            rows = self.cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            print(f"Error getting emails for candidate: {e}")
            return []