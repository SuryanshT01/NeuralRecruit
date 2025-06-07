
import React, { useState } from 'react';
import { 
  FileUp, 
  Users, 
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  BadgeCheck,
  X,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import ProgressBar from '@/components/common/ProgressBar';

// Mock data
const mockCandidates = [
  { 
    id: 1, 
    name: "John Doe", 
    email: "john.doe@example.com",
    role: "Software Engineer",
    experience: "7 years",
    skills: ["React", "Node.js", "TypeScript"],
    education: "M.S. Computer Science",
    location: "San Francisco, CA",
    dateAdded: "2023-04-01",
    matchScore: 92
  },
  { 
    id: 2, 
    name: "Jane Smith", 
    email: "jane.smith@example.com",
    role: "Product Manager",
    experience: "5 years",
    skills: ["Product Strategy", "User Research", "Agile"],
    education: "MBA",
    location: "New York, NY",
    dateAdded: "2023-04-03",
    matchScore: 88
  },
  { 
    id: 3, 
    name: "Michael Johnson", 
    email: "michael.j@example.com",
    role: "UX Designer",
    experience: "4 years",
    skills: ["Figma", "UI Design", "User Testing"],
    education: "B.A. Design",
    location: "Austin, TX",
    dateAdded: "2023-04-05",
    matchScore: 85
  },
  { 
    id: 4, 
    name: "Emily Williams", 
    email: "emily.w@example.com",
    role: "Data Scientist",
    experience: "3 years",
    skills: ["Python", "Machine Learning", "SQL"],
    education: "Ph.D. Statistics",
    location: "Boston, MA",
    dateAdded: "2023-04-10",
    matchScore: 78
  }
];

const Candidates = () => {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState(mockCandidates);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  const filteredCandidates = candidates.filter(candidate => 
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
    candidate.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // In a real app, you would send this file to the API
      toast({
        title: "Resume Uploaded",
        description: `${file.name} has been uploaded and is being processed.`,
      });
      setIsUploadDialogOpen(false);
    }
  };

  const deleteCandidate = (id: number) => {
    // In a real app, you would call the API to delete the candidate
    setCandidates(candidates.filter(candidate => candidate.id !== id));
    
    toast({
      title: "Candidate Removed",
      description: "The candidate has been successfully removed.",
    });
  };

  const viewCandidateDetails = (id: number) => {
    setSelectedCandidate(id);
  };

  const candidateDetails = candidates.find(c => c.id === selectedCandidate);

  return (
    <div className="space-y-6 animate-fade-in">
      {selectedCandidate === null ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
              <p className="text-muted-foreground">
                View and manage your candidate pool.
              </p>
            </div>
            
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload Resume
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Candidate Resume</DialogTitle>
                  <DialogDescription>
                    Upload a resume file (PDF, DOCX) to parse with AI.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="resume-file">Resume File</Label>
                    <Input id="resume-file" type="file" onChange={handleFileUpload} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Upload & Process</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates by name, skills, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Candidates</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Highest Match Score
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Most Experience
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {candidates.length === 0 ? (
            <EmptyState
              title="No Candidates"
              description="Upload resumes to build your candidate pool for AI-powered matching."
              icon={<Users className="h-10 w-10 text-muted-foreground" />}
              action={{
                label: "Upload Resume",
                onClick: () => setIsUploadDialogOpen(true)
              }}
              className="mt-10"
            />
          ) : filteredCandidates.length === 0 ? (
            <EmptyState
              title="No Results Found"
              description={`No candidates match "${searchQuery}". Try a different search term.`}
              icon={<Search className="h-10 w-10 text-muted-foreground" />}
              className="mt-10"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead className="hidden md:table-cell">Experience</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead>
                      <div className="flex items-center space-x-1">
                        <span>Match Score</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{candidate.name}</div>
                            <div className="text-sm text-muted-foreground">{candidate.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 2).map((skill, i) => (
                            <Badge key={i} variant="outline">{skill}</Badge>
                          ))}
                          {candidate.skills.length > 2 && (
                            <Badge variant="outline">+{candidate.skills.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {candidate.experience}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {candidate.location}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={candidate.matchScore >= 85 ? "text-green-600 font-medium" : ""}>{candidate.matchScore}%</span>
                          <ProgressBar value={candidate.matchScore} size="sm" className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteCandidate(candidate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewCandidateDetails(candidate.id)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex items-center justify-between px-4 py-2 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCandidates.length} of {candidates.length} candidates
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedCandidate(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Candidates
              </Button>
              
              <h2 className="text-2xl font-bold">{candidateDetails?.name}</h2>
              {candidateDetails?.matchScore >= 85 && (
                <div className="flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                  High Match
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Resume
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-lg">Candidate Summary</h3>
                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm text-muted-foreground">Current Role</h4>
                    <p>{candidateDetails?.role}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Experience</h4>
                    <p>{candidateDetails?.experience}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Education</h4>
                    <p>{candidateDetails?.education}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Location</h4>
                    <p>{candidateDetails?.location}</p>
                  </div>
                  <div>
                    <h4 className="text-sm text-muted-foreground">Contact</h4>
                    <p>{candidateDetails?.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidateDetails?.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">Match Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Match</span>
                      <span className="font-medium">{candidateDetails?.matchScore}%</span>
                    </div>
                    <ProgressBar value={candidateDetails?.matchScore || 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Skills Match</span>
                      <span className="font-medium">90%</span>
                    </div>
                    <ProgressBar value={90} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Experience Match</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <ProgressBar value={85} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Education Match</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <ProgressBar value={95} />
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Recommended Jobs</h3>
                  <ul className="space-y-2">
                    <li className="border rounded-md p-2">
                      <div className="font-medium">Senior Software Engineer</div>
                      <div className="text-sm text-muted-foreground">TechCorp • 92% Match</div>
                    </li>
                    <li className="border rounded-md p-2">
                      <div className="font-medium">Full Stack Developer</div>
                      <div className="text-sm text-muted-foreground">InnovateTech • 88% Match</div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates;
