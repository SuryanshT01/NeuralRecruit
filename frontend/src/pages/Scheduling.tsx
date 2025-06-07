
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Send, 
  UserCheck, 
  PlusCircle, 
  CalendarCheck, 
  X,
  MessageSquare,
  Edit,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockJobs = [
  { id: 1, title: "Senior Software Engineer", company: "TechCorp" },
  { id: 2, title: "Product Manager", company: "InnovateTech" },
  { id: 3, title: "UX Designer", company: "DesignHub" }
];

const mockCandidates = [
  { 
    id: 1, 
    name: "John Doe", 
    email: "john.doe@example.com",
    role: "Software Engineer",
    matchScore: 92
  },
  { 
    id: 2, 
    name: "Jane Smith", 
    email: "jane.smith@example.com",
    role: "Product Manager",
    matchScore: 88
  },
  { 
    id: 3, 
    name: "Michael Johnson", 
    email: "michael.j@example.com",
    role: "UX Designer",
    matchScore: 85
  }
];

const mockInterviews = [
  {
    id: 1,
    candidate: mockCandidates[0],
    job: mockJobs[0],
    date: new Date(2025, 4, 10, 14, 0),
    duration: 60,
    status: "scheduled",
    interviewers: ["Alex Rivera", "Sarah Chen"]
  },
  {
    id: 2,
    candidate: mockCandidates[1],
    job: mockJobs[1],
    date: new Date(2025, 4, 11, 11, 0),
    duration: 45,
    status: "scheduled",
    interviewers: ["Mike Johnson", "Lisa Wong"]
  }
];

const timeOptions = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
];

const durationOptions = [
  "30 minutes", "45 minutes", "60 minutes", "90 minutes", "120 minutes"
];

const Scheduling = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [interviews, setInterviews] = useState(mockInterviews);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("upcoming");
  const [newInterview, setNewInterview] = useState({
    job: "",
    candidate: "",
    time: "",
    duration: "",
    interviewers: ""
  });
  const [emailTemplate, setEmailTemplate] = useState(`Dear [Candidate Name],

We are pleased to invite you for an interview for the [Job Title] position at [Company Name]. The interview details are as follows:

Date: [Interview Date]
Time: [Interview Time]
Duration: [Interview Duration]
Location: Video Conference (link will be provided)

Please confirm your availability by replying to this email. If you have any questions or need to reschedule, please let us know.

We look forward to speaking with you!

Best regards,
[Company Name] Hiring Team`);

  const handleScheduleInterview = () => {
    // Validation
    if (!date || !newInterview.job || !newInterview.candidate || !newInterview.time || !newInterview.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    // Get candidate and job details
    const candidate = mockCandidates.find(c => c.id.toString() === newInterview.candidate);
    const job = mockJobs.find(j => j.id.toString() === newInterview.job);
    
    if (!candidate || !job) {
      toast({
        title: "Error",
        description: "Invalid candidate or job selection.",
        variant: "destructive"
      });
      return;
    }
    
    // Parse time string to create Date object
    const [hourStr, minuteStr, period] = newInterview.time.split(/[: ]/);
    let hours = parseInt(hourStr);
    const minutes = parseInt(minuteStr);
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    
    const interviewDate = new Date(date);
    interviewDate.setHours(hours, minutes);
    
    // Parse duration
    const duration = parseInt(newInterview.duration.split(" ")[0]);
    
    // In a real app, you would call the API to schedule the interview
    const newInterviewObj = {
      id: interviews.length + 1,
      candidate,
      job,
      date: interviewDate,
      duration,
      status: "scheduled",
      interviewers: newInterview.interviewers.split(",").map(name => name.trim())
    };
    
    setInterviews([...interviews, newInterviewObj]);
    setIsScheduleDialogOpen(false);
    
    // Reset form
    setNewInterview({
      job: "",
      candidate: "",
      time: "",
      duration: "",
      interviewers: ""
    });
    setDate(undefined);
    
    toast({
      title: "Interview Scheduled",
      description: `Interview with ${candidate.name} for ${job.title} has been scheduled.`,
    });
    
    // Open email dialog
    setIsEmailDialogOpen(true);
  };

  const handleSendEmails = () => {
    // In a real app, you would call the API to send emails
    toast({
      title: "Emails Sent",
      description: "Interview invitation emails have been scheduled to be sent.",
    });
    
    setIsEmailDialogOpen(false);
  };

  const handleSaveTemplate = () => {
    // In a real app, you would call the API to save the email template
    toast({
      title: "Template Saved",
      description: "Email template has been saved successfully.",
    });
    
    setIsTemplateDialogOpen(false);
  };

  const upcomingInterviews = interviews.filter(interview => new Date(interview.date) >= new Date());
  const pastInterviews = interviews.filter(interview => new Date(interview.date) < new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Scheduling</h1>
          <p className="text-muted-foreground">
            Schedule and manage candidate interviews.
          </p>
        </div>
        
        <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
              <DialogDescription>
                Create a new interview appointment for a candidate.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="job">Job Position</Label>
                  <Select 
                    value={newInterview.job} 
                    onValueChange={(value) => setNewInterview({...newInterview, job: value})}
                  >
                    <SelectTrigger id="job">
                      <SelectValue placeholder="Select job..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockJobs.map(job => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="candidate">Candidate</Label>
                  <Select 
                    value={newInterview.candidate} 
                    onValueChange={(value) => setNewInterview({...newInterview, candidate: value})}
                  >
                    <SelectTrigger id="candidate">
                      <SelectValue placeholder="Select candidate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCandidates.map(candidate => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Interview Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="time">Interview Time</Label>
                  <Select 
                    value={newInterview.time} 
                    onValueChange={(value) => setNewInterview({...newInterview, time: value})}
                  >
                    <SelectTrigger id="time">
                      <SelectValue placeholder="Select time..." />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select 
                    value={newInterview.duration} 
                    onValueChange={(value) => setNewInterview({...newInterview, duration: value})}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration..." />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map(duration => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="interviewers">Interviewers</Label>
                  <Input 
                    id="interviewers" 
                    placeholder="Names separated by commas"
                    value={newInterview.interviewers}
                    onChange={(e) => setNewInterview({...newInterview, interviewers: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleInterview}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Interview Invitations</DialogTitle>
              <DialogDescription>
                Prepare and send email invitations to the candidate and interviewers.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Template</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-1"
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Template
                  </Button>
                </div>
                <div className="rounded-md border p-4 text-sm">
                  <pre className="whitespace-pre-wrap font-sans">{emailTemplate}</pre>
                </div>
                <p className="text-sm text-muted-foreground">
                  Placeholders will be filled with actual interview details.
                </p>
              </div>
              
              <div>
                <Label className="mb-2 block">Recipients</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <UserCheck className="h-4 w-4 text-green-500" />
                    <span>John Doe &lt;john.doe@example.com&gt;</span>
                    <Badge variant="secondary" className="ml-auto">Candidate</Badge>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span>Alex Rivera &lt;alex.r@company.com&gt;</span>
                    <Badge variant="outline" className="ml-auto">Interviewer</Badge>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-2">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span>Sarah Chen &lt;sarah.c@company.com&gt;</span>
                    <Badge variant="outline" className="ml-auto">Interviewer</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendEmails} className="gap-2">
                <Send className="h-4 w-4" />
                Send Invitations
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Email Template</DialogTitle>
              <DialogDescription>
                Customize the email template for interview invitations.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template Content</Label>
                <Textarea 
                  id="template"
                  className="font-mono text-sm h-72"
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Available placeholders:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>[Candidate Name]</li>
                    <li>[Job Title]</li>
                    <li>[Company Name]</li>
                    <li>[Interview Date]</li>
                    <li>[Interview Time]</li>
                    <li>[Interview Duration]</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>Save Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="upcoming" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Past Interviews ({pastInterviews.length})
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="upcoming">
            {upcomingInterviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Upcoming Interviews</p>
                  <p className="text-muted-foreground mb-6">
                    Schedule interviews to see them here.
                  </p>
                  <Button onClick={() => setIsScheduleDialogOpen(true)}>
                    Schedule First Interview
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingInterviews.map(interview => (
                  <Card key={interview.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{interview.job.title}</CardTitle>
                          <CardDescription>{interview.job.company}</CardDescription>
                        </div>
                        <Badge>
                          {format(new Date(interview.date), "MMM d, yyyy")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 md:gap-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {interview.candidate.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{interview.candidate.name}</p>
                            <p className="text-sm text-muted-foreground">{interview.candidate.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary/30">
                            <Clock className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(interview.date), "h:mm a")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interview.duration} minutes
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Interviewers
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interview.interviewers.join(", ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex w-full justify-between">
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Send Reminder
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="destructive" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {pastInterviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Clock className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No Past Interviews</p>
                  <p className="text-muted-foreground">
                    Past interviews will be displayed here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastInterviews.map(interview => (
                  <Card key={interview.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>{interview.job.title}</CardTitle>
                          <CardDescription>{interview.job.company}</CardDescription>
                        </div>
                        <Badge variant="outline">
                          {format(new Date(interview.date), "MMM d, yyyy")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 md:gap-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {interview.candidate.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{interview.candidate.name}</p>
                            <p className="text-sm text-muted-foreground">{interview.candidate.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(interview.date), "h:mm a")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interview.duration} minutes
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-auto flex items-center">
                          <Badge className="gap-1 bg-green-500">
                            <CheckCheck className="h-3 w-3" />
                            Completed
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex w-full justify-end gap-2">
                        <Button variant="outline" size="sm">
                          View Notes
                        </Button>
                        <Button size="sm">
                          Add Feedback
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Scheduling;
