import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  FileUp, 
  FileText, 
  Trash2,
  Search,
  X
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8000';

const JobDescriptions = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [jobTextContent, setJobTextContent] = useState("");
  const [newJobData, setNewJobData] = useState({
    title: "",
    company: "",
    location: "",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/`);
      setJobs(response.data.jobs);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch job descriptions.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('job_description_file', file);
      try {
        const response = await axios.post(`${API_BASE_URL}/upload-jd/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast({
          title: "Job Description Uploaded",
          description: `${response.data.title} has been uploaded and is being processed.`,
        });
        fetchJobs(); // Refresh job list
        setIsUploadDialogOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload job description.",
          variant: "destructive"
        });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateJob = async () => {
    if (!newJobData.title || !newJobData.company || !newJobData.location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const jobDescriptionText = `
        Job Title: ${newJobData.title}
        Company: ${newJobData.company}
        Location: ${newJobData.location}
        Description: ${newJobData.description}
      `;
      const response = await axios.post(`${API_BASE_URL}/parse-jd/`, {
        job_description_text: jobDescriptionText
      });
      toast({
        title: "Job Description Created",
        description: `${response.data.title} has been created successfully.`,
      });
      fetchJobs(); // Refresh job list
      setIsCreateDialogOpen(false);
      setNewJobData({
        title: "",
        company: "",
        location: "",
        description: ""
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job description.",
        variant: "destructive"
      });
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleParseJobText = async () => {
    if (jobTextContent.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter job description text to parse.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/parse-jd/`, {
        job_description_text: jobTextContent
      });
      toast({
        title: "Parsing Complete",
        description: "Job description has been successfully parsed.",
      });
      fetchJobs(); // Refresh job list
      setJobTextContent("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse job description.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteJob = async (job_id) => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/jobs/${job_id}`);
      toast({
        title: "Job Description Deleted",
        description: "The job description has been successfully deleted.",
      });
      fetchJobs(); // Refresh job list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job description.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Descriptions</h1>
          <p className="text-muted-foreground">
            Manage and analyze your job positions with AI assistance.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <FileUp className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Job Description</DialogTitle>
                <DialogDescription>
                  Upload a job description file (PDF, DOCX) to parse with AI.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="job-file">Job Description File</Label>
                  <Input id="job-file" type="file" onChange={handleFileUpload} disabled={isLoading} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button disabled={isLoading}>Upload & Process</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Job Description</DialogTitle>
                <DialogDescription>
                  Enter job details or paste a job description for AI parsing.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="form">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="form">Enter Details</TabsTrigger>
                  <TabsTrigger value="text">Parse Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form" className="space-y-4">
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input 
                        id="title" 
                        value={newJobData.title}
                        onChange={(e) => setNewJobData({...newJobData, title: e.target.value})}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        value={newJobData.company}
                        onChange={(e) => setNewJobData({...newJobData, company: e.target.value})}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={newJobData.location}
                        onChange={(e) => setNewJobData({...newJobData, location: e.target.value})}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea 
                        id="description" 
                        rows={5}
                        value={newJobData.description}
                        onChange={(e) => setNewJobData({...newJobData, description: e.target.value})}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateJob} disabled={isLoading}>Create Job</Button>
                  </DialogFooter>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="job-text">Paste Job Description Text</Label>
                    <Textarea 
                      id="job-text" 
                      placeholder="Paste the full job description here..." 
                      rows={10}
                      value={jobTextContent}
                      onChange={(e) => setJobTextContent(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Our AI will parse the text and extract key details.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleParseJobText} disabled={isLoading}>Parse with AI</Button>
                  </DialogFooter>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search job descriptions..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery("")}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No Job Descriptions"
          description="Create or upload a job description to get started with AI-powered candidate matching."
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          action={{
            label: "Create Job Description",
            onClick: () => setIsCreateDialogOpen(true)
          }}
          className="mt-10"
        />
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          title="No Results Found"
          description={`No job descriptions match "${searchQuery}". Try a different search term.`}
          icon={<Search className="h-10 w-10 text-muted-foreground" />}
          className="mt-10"
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.job_id} className="card-hover">
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>{job.company} • {job.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Key Requirements</h4>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {(job.requirements?.required_skills || []).slice(0, 3).map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created: {job.posting_date}</span>
                    <span>{job.candidate_count || 0} candidates</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => deleteJob(job.job_id)} disabled={isLoading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" disabled={isLoading}>View Details</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobDescriptions;