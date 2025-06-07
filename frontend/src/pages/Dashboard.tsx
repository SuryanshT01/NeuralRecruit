
import React from 'react';
import { 
  Briefcase, 
  Users, 
  FileCheck, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  Clock,
} from 'lucide-react';
import DashboardCard from '@/components/common/DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProgressBar from '@/components/common/ProgressBar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Dashboard = () => {
  // Mock data
  const recentMatches = [
    { id: 1, candidate: "John Doe", job: "Senior Software Engineer", score: 92 },
    { id: 2, candidate: "Jane Smith", job: "Product Manager", score: 88 },
    { id: 3, candidate: "Robert Johnson", job: "UX Designer", score: 85 },
    { id: 4, candidate: "Emily Williams", job: "Data Scientist", score: 78 }
  ];
  
  const upcomingInterviews = [
    { id: 1, candidate: "John Doe", job: "Senior Software Engineer", time: "Today, 2:00 PM" },
    { id: 2, candidate: "Jane Smith", job: "Product Manager", time: "Tomorrow, 10:30 AM" }
  ];
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to NeuralRecruit, your AI-powered recruitment platform.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Total Jobs" 
          value="12" 
          icon={Briefcase}
          description="Active job descriptions"
          trend={{ value: 8, isPositive: true }}
        />
        <DashboardCard 
          title="Candidates" 
          value="143" 
          icon={Users}
          description="In candidate pool"
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardCard 
          title="Matches" 
          value="98" 
          icon={FileCheck}
          description="Candidate-job matches"
          trend={{ value: 24, isPositive: true }}
        />
        <DashboardCard 
          title="Interviews" 
          value="32" 
          icon={Calendar}
          description="Scheduled this month"
          trend={{ value: 5, isPositive: true }}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Latest AI-powered candidate matches</CardDescription>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMatches.map(match => (
                <div key={match.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-secondary/30 text-secondary-foreground">
                        {match.candidate.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{match.candidate}</p>
                      <p className="text-xs text-muted-foreground">{match.job}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{match.score}%</span>
                    <ProgressBar value={match.score} size="sm" className="w-20" />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-4 w-full">
              View all matches <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>Scheduled interviews this week</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map(interview => (
                <div key={interview.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/30 text-primary-foreground">
                        {interview.candidate.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{interview.candidate}</p>
                      <p className="text-xs text-muted-foreground">{interview.job}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{interview.time}</p>
                  </div>
                </div>
              ))}
              
              {upcomingInterviews.length < 3 && (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No more interviews scheduled this week.</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Schedule New Interview
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
