
import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Database,
  Mail,
  ShieldCheck,
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    model: "mistral",
    threshold: "75",
    autoShortlist: true,
    parseJD: true,
    parseResume: true
  });
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "smtp.example.com",
    port: "587",
    username: "notifications@company.com",
    password: "••••••••••",
    fromName: "HR Recruitment",
    fromEmail: "hr@company.com"
  });

  const handleSaveAISettings = () => {
    setIsLoading(true);
    // In a real app, you would call the API to save the settings
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings Saved",
        description: "AI model settings have been updated successfully.",
      });
    }, 1000);
  };

  const handleSaveEmailSettings = () => {
    setIsLoading(true);
    // In a real app, you would call the API to save the settings
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Email Settings Saved",
        description: "Email configuration has been updated successfully.",
      });
    }, 1000);
  };

  const handleTestConnection = () => {
    setIsLoading(true);
    // In a real app, you would call the API to test the connection
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Connection Successful",
        description: "Database connection test completed successfully.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure the AI recruitment platform settings.
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-primary" />
              <CardTitle>AI Model Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure the AI model settings used for parsing and matching.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">AI Model</Label>
                  <Select 
                    value={aiSettings.model} 
                    onValueChange={(value) => setAiSettings({...aiSettings, model: value})}
                  >
                    <SelectTrigger id="ai-model">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistral">Mistral</SelectItem>
                      <SelectItem value="llama">LLaMA</SelectItem>
                      <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                      <SelectItem value="llama-2">LLaMA 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="threshold">Matching Threshold (%)</Label>
                  <Input 
                    id="threshold" 
                    type="number" 
                    min="1" 
                    max="100" 
                    value={aiSettings.threshold}
                    onChange={(e) => setAiSettings({...aiSettings, threshold: e.target.value})}
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum score required for candidate matching.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-shortlist">Automatic Shortlisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically shortlist candidates above threshold.
                    </p>
                  </div>
                  <Switch 
                    id="auto-shortlist"
                    checked={aiSettings.autoShortlist}
                    onCheckedChange={(checked) => setAiSettings({...aiSettings, autoShortlist: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="parse-jd">Parse Job Descriptions</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI to parse uploaded job descriptions.
                    </p>
                  </div>
                  <Switch 
                    id="parse-jd"
                    checked={aiSettings.parseJD}
                    onCheckedChange={(checked) => setAiSettings({...aiSettings, parseJD: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="parse-resume">Parse Resumes</Label>
                    <p className="text-sm text-muted-foreground">
                      Use AI to extract data from uploaded resumes.
                    </p>
                  </div>
                  <Switch 
                    id="parse-resume"
                    checked={aiSettings.parseResume}
                    onCheckedChange={(checked) => setAiSettings({...aiSettings, parseResume: checked})}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveAISettings} disabled={isLoading} className="ml-auto">
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save AI Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Database Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure the database connection settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="database">
                <AccordionTrigger>Database Settings</AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="db-type">Database Type</Label>
                        <Select defaultValue="sqlite">
                          <SelectTrigger id="db-type">
                            <SelectValue placeholder="Select database type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sqlite">SQLite</SelectItem>
                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                            <SelectItem value="mysql">MySQL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="db-path">Database Path</Label>
                        <Input id="db-path" defaultValue="./data/recruitment.db" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleTestConnection} variant="outline" size="sm" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>Test Connection</>
                        )}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure email settings for sending interview invitations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input 
                    id="smtp-server" 
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input 
                    id="smtp-port" 
                    value={emailSettings.port}
                    onChange={(e) => setEmailSettings({...emailSettings, port: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input 
                    id="smtp-username" 
                    value={emailSettings.username}
                    onChange={(e) => setEmailSettings({...emailSettings, username: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input 
                    id="smtp-password" 
                    type="password" 
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings({...emailSettings, password: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input 
                    id="from-name" 
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input 
                    id="from-email" 
                    type="email" 
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-template">Default Email Template</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Interview invitation template</p>
                    <Button variant="outline" size="sm" className="gap-1">
                      <FileText className="h-4 w-4" />
                      Edit Template
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button onClick={handleSaveEmailSettings} disabled={isLoading} className="ml-auto">
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Email Settings
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>
              Configure security and access settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for admin access.
                </p>
              </div>
              <Switch defaultChecked={true} />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Retention</Label>
                <p className="text-sm text-muted-foreground">
                  Configure how long data is stored.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                Configure
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>API Access</Label>
                <p className="text-sm text-muted-foreground">
                  Manage API keys and permissions.
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                Manage Keys
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
