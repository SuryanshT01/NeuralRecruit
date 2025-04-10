import json
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from .matcher import MatchResult

class ShortlistResult(BaseModel):
    """Model for the result of a shortlisting process"""
    job_id: str
    shortlisted_candidates: List[str]  # List of candidate IDs
    rejected_candidates: List[str]  # List of candidate IDs
    shortlist_threshold: float  # Score threshold used for shortlisting
    shortlist_stats: Dict[str, Any] = Field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return json.loads(self.json())

class ShortlisterAgent:
    """Agent for shortlisting candidates based on match scores"""
    
    def __init__(self, default_threshold: float = 70.0):
        self.default_threshold = default_threshold
    
    def shortlist_candidates(self, match_results: List[MatchResult], threshold: Optional[float] = None) -> ShortlistResult:
        """Shortlist candidates based on match scores"""
        if threshold is None:
            threshold = self.default_threshold
        
        # Check if there are any match results
        if not match_results:
            return ShortlistResult(
                job_id="unknown",
                shortlisted_candidates=[],
                rejected_candidates=[],
                shortlist_threshold=threshold,
                shortlist_stats={
                    "total_candidates": 0,
                    "shortlisted_count": 0,
                    "rejected_count": 0,
                    "shortlist_percentage": 0.0,
                    "avg_shortlisted_score": 0.0,
                    "avg_rejected_score": 0.0
                }
            )
        
        # Extract job ID from the first match result
        job_id = match_results[0].job_id
        
        # Separate shortlisted and rejected candidates
        shortlisted = []
        rejected = []
        
        shortlisted_scores = []
        rejected_scores = []
        
        for result in match_results:
            if result.overall_match_score >= threshold:
                shortlisted.append(result.candidate_id)
                shortlisted_scores.append(result.overall_match_score)
            else:
                rejected.append(result.candidate_id)
                rejected_scores.append(result.overall_match_score)
        
        # Calculate statistics
        total_candidates = len(match_results)
        shortlisted_count = len(shortlisted)
        rejected_count = len(rejected)
        
        shortlist_percentage = (shortlisted_count / total_candidates) * 100 if total_candidates > 0 else 0.0
        
        avg_shortlisted_score = sum(shortlisted_scores) / shortlisted_count if shortlisted_count > 0 else 0.0
        avg_rejected_score = sum(rejected_scores) / rejected_count if rejected_count > 0 else 0.0
        
        # Create and return ShortlistResult
        result = ShortlistResult(
            job_id=job_id,
            shortlisted_candidates=shortlisted,
            rejected_candidates=rejected,
            shortlist_threshold=threshold,
            shortlist_stats={
                "total_candidates": total_candidates,
                "shortlisted_count": shortlisted_count,
                "rejected_count": rejected_count,
                "shortlist_percentage": shortlist_percentage,
                "avg_shortlisted_score": avg_shortlisted_score,
                "avg_rejected_score": avg_rejected_score
            }
        )
        
        return result

# Example usage
if __name__ == "__main__":
    from matcher import MatchResult
    
    # Create sample match results
    match_results = [
        MatchResult(
            job_id="JD-1234",
            candidate_id="C-5678",
            overall_match_score=85.5,
            skill_match_score=90.0,
            experience_match_score=80.0,
            education_match_score=100.0,
            match_details={}
        ),
        MatchResult(
            job_id="JD-1234",
            candidate_id="C-5679",
            overall_match_score=65.2,
            skill_match_score=60.0,
            experience_match_score=70.0,
            education_match_score=80.0,
            match_details={}
        ),
        MatchResult(
            job_id="JD-1234",
            candidate_id="C-5680",
            overall_match_score=92.7,
            skill_match_score=95.0,
            experience_match_score=90.0,
            education_match_score=100.0,
            match_details={}
        ),
        MatchResult(
            job_id="JD-1234",
            candidate_id="C-5681",
            overall_match_score=72.0,
            skill_match_score=75.0,
            experience_match_score=70.0,
            education_match_score=60.0,
            match_details={}
        )
    ]
    
    # Shortlist candidates
    shortlister = ShortlisterAgent()
    shortlist_result = shortlister.shortlist_candidates(match_results)
    print(json.dumps(shortlist_result.to_dict(), indent=2))