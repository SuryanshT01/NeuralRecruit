
import React, { useState } from 'react';
import { 
  FileCheck, 
  Search, 
  ChevronDown, 
  Star, 
  StarHalf, 
  X,
  User,
  Briefcase,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ProgressBar from '@/components/common/ProgressBar';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

// Mock data
const mockJobs = [
  { id: 1, title: "Senior Software Engineer", company: "TechCorp", candidates: 24 },
  { id: 2, title: "Product Manager", company: "InnovateTech", candidates: 18 },
  { id: 3, title: "UX Designer", company: "DesignHub", candidates: 15 }
];

const mockCandidates = [
  { 
    id: 1, 
    name: "John Doe", 
    role: "Software Engineer",
    skills: ["React", "Node.js", "TypeScript", "AWS", "MongoDB"],
    experience: "7 years",
    location: "San Francisco, CA",
    education: "M.S. Computer Science, Stanford",
    matchScore: 92,
    keyPoints: [
      "Strong backend architecture experience",
      "Led team of 5 engineers",
      "Contributed to open source"
    ]
  },
  { 
    id: 2, 
    name: "Jane Smith", 
    role: "Product Manager",
    skills: ["Product Strategy", "User Research", "Agile", "Data Analysis"],
    experience: "5 years",
    location: "New York, NY",
    education: "MBA, Columbia",
    matchScore: 88,
    keyPoints: [
      "Launched 3 successful products",
      "User-centered design focus",
      "Strong stakeholder management"
    ]
  },
  { 
    id: 3, 
    name: "Michael Johnson", 
    role: "UX Designer",
    skills: ["Figma", "UI Design", "User Testing", "Design Systems"],
    experience: "4 years",
    location: "Austin, TX",
    education: "B.A. Design, RISD",
    matchScore: 85,
    keyPoints: [
      "Created design system from scratch",
      "Conducted over 50 user interviews",
      "Improved conversion by 25%"
    ]
  },
  { 
    id: 4, 
    name: "Emily Williams", 
    role: "Data Scientist",
    skills: ["Python", "Machine Learning", "SQL", "Data Visualization"],
    experience: "3 years",
    location: "Boston, MA",
    education: "Ph.D. Statistics, MIT",
    matchScore: 78,
    keyPoints: [
      "Implemented ML models for prediction",
      "Published 3 research papers",
      "Experience with big data frameworks"
    ]
  },
  { 
    id: 5, 
    name: "David Brown", 
    role: "Backend Developer",
    skills: ["Java", "Spring Boot", "Kubernetes", "Microservices"],
    experience: "6 years",
    location: "Seattle, WA",
    education: "B.S. Computer Science, University of Washington",
    matchScore: 75,
    keyPoints: [
      "Built scalable microservices architecture",
      "Reduced server costs by 30%",
      "Implemented CI/CD pipeline"
    ]
  }
];

const Matching = () => {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [matchResults, setMatchResults] = useState<typeof mockCandidates | null>(null);
  const [shortlisted, setShortlisted] = useState<number[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCandidates = matchResults 
    ? matchResults.filter(candidate => 
        candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        candidate.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleMatch = () => {
    if (!selectedJob) {
      toast({
        title: "Error",
        description: "Please select a job to match candidates with.",
        variant: "destructive"
      });
      return;
    }
    
    setIsMatching(true);
    // In a real app, you would call the API to perform the matching
    
    // Simulate API call
    setTimeout(() => {
      setIsMatching(false);
      setMatchResults(mockCandidates);
      
      toast({
        title: "Matching Complete",
        description: `Found ${mockCandidates.length} matching candidates for this position.`,
      });
    }, 1500);
  };

  const toggleCandidateSelection = (candidateId: number) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleShortlist = () => {
    if (selectedCandidates.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one candidate to shortlist.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, you would call the API to save the shortlist
    setShortlisted(selectedCandidates);
    
    toast({
      title: "Candidates Shortlisted",
      description: `${selectedCandidates.length} candidates have been shortlisted for review.`,
    });
  };

  const getStarRating = (score: number) => {
    if (score >= 90) return [<Star key="1" fill="#FFD700" />, <Star key="2" fill="#FFD700" />, <Star key="3" fill="#FFD700" />, <Star key="4" fill="#FFD700" />, <Star key="5" fill="#FFD700" />];
    if (score >= 80) return [<Star key="1" fill="#FFD700" />, <Star key="2" fill="#FFD700" />, <Star key="3" fill="#FFD700" />, <Star key="4" fill="#FFD700" />, <StarHalf key="5" fill="#FFD700" />];
    if (score >= 70) return [<Star key="1" fill="#FFD700" />, <Star key="2" fill="#FFD700" />, <Star key="3" fill="#FFD700" />, <Star key="4" fill="#FFD700" />, <Star key="5" />];
    if (score >= 60) return [<Star key="1" fill="#FFD700" />, <Star key="2" fill="#FFD700" />, <Star key="3" fill="#FFD700" />, <StarHalf key="4" fill="#FFD700" />, <Star key="5" />];
    return [<Star key="1" fill="#FFD700" />, <Star key="2" fill="#FFD700" />, <Star key="3" fill="#FFD700" />, <Star key="4" />, <Star key="5" />];
  };

  const selectedJobData = mockJobs.find(job => job.id.toString() === selectedJob);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidate Matching</h1>
        <p className="text-muted-foreground">
          AI-powered matching of candidates to job descriptions.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Match Candidates to Jobs</CardTitle>
          <CardDescription>
            Select a job description to find the best matching candidates based on skills, experience, and background.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Job Description</label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {mockJobs.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 flex items-end">
              <Button 
                className="gap-2" 
                size="lg" 
                onClick={handleMatch} 
                disabled={!selectedJob || isMatching}
              >
                {isMatching ? (
                  <>Analyzing Candidates...</>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4" />
                    Match Candidates
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {matchResults && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Match Results</h2>
              <p className="text-muted-foreground">
                Showing {filteredCandidates.length} candidates matched with{" "}
                <span className="font-medium">{selectedJobData?.title}</span>
              </p>
            </div>
            
            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter candidates..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1.5 h-7 w-7"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <Button 
                variant="outline"
                className="gap-2"
                onClick={handleShortlist}
                disabled={selectedCandidates.length === 0}
              >
                <CheckCircle2 className="h-4 w-4" />
                Shortlist ({selectedCandidates.length})
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCandidates.map(candidate => (
              <Card 
                key={candidate.id}
                className={`${
                  selectedCandidates.includes(candidate.id) 
                    ? "border-primary" 
                    : ""
                } ${
                  shortlisted.includes(candidate.id)
                    ? "bg-primary/5"
                    : ""
                } relative`}
              >
                {shortlisted.includes(candidate.id) && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Shortlisted
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{candidate.name}</CardTitle>
                        <CardDescription>{candidate.role}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-center rounded-full h-12 w-12 bg-muted/50 text-lg font-semibold">
                      {candidate.matchScore}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Match Score</span>
                      <div className="flex">
                        {getStarRating(candidate.matchScore).map((star, i) => (
                          <div key={i} className="h-4 w-4">{star}</div>
                        ))}
                      </div>
                    </div>
                    <ProgressBar value={candidate.matchScore} />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Key Strengths</div>
                    <ul className="text-sm space-y-1">
                      {candidate.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <div className="mr-2 mt-0.5 h-1.5 w-1.5 rounded-full bg-primary/70" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Experience: </span>
                      {candidate.experience}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location: </span>
                      {candidate.location}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={selectedCandidates.includes(candidate.id) ? "default" : "outline"} 
                    className="w-full gap-2"
                    onClick={() => toggleCandidateSelection(candidate.id)}
                  >
                    {selectedCandidates.includes(candidate.id) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Selected
                      </>
                    ) : (
                      "Select Candidate"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {shortlisted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Shortlisted Candidates
            </CardTitle>
            <CardDescription>
              {shortlisted.length} candidates shortlisted for {selectedJobData?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full h-12 w-12 bg-primary">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{shortlisted.length}</p>
                  <p className="text-xs text-muted-foreground">Candidates</p>
                </div>
              </div>
              
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full h-12 w-12 bg-secondary">
                  <Briefcase className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">{selectedJobData?.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedJobData?.company}</p>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex justify-end gap-3">
              <Button variant="outline">Export Shortlist</Button>
              <Button>
                Schedule Interviews
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Matching;
