
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, Settings, Database, Users, MessageSquare, 
  Terminal, Key, Lock, Bot, Code, FileText, 
  AlertCircle, CheckCircle, Activity, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GrokMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [activeTab, setActiveTab] = useState("grok-chat");
  const [grokMessages, setGrokMessages] = useState<GrokMessage[]>([]);
  const [grokInput, setGrokInput] = useState("");
  const [isGrokLoading, setIsGrokLoading] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeToAmend, setCodeToAmend] = useState("");
  const [errorToFix, setErrorToFix] = useState("");
  const { toast } = useToast();

  // Admin Authentication
  const handleAdminLogin = async () => {
    if (adminCode === "admin") {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'admin', password: 'pass' })
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('adminToken', data.token);
          setIsAuthenticated(true);
          toast({
            title: "Admin Access Granted",
            description: "Welcome to the Grok Admin Dashboard",
          });
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        toast({
          title: "Access Denied",
          description: "Invalid admin credentials",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Access Denied", 
        description: "Invalid admin code",
        variant: "destructive",
      });
    }
  };

  // Grok Chat Functions
  const sendGrokMessage = async () => {
    if (!grokInput.trim()) return;
    
    const userMessage: GrokMessage = {
      role: 'user',
      content: grokInput,
      timestamp: new Date()
    };
    
    setGrokMessages(prev => [...prev, userMessage]);
    setGrokInput("");
    setIsGrokLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/grok/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: grokInput }],
          model: 'grok-2-1212',
          maxTokens: 8192
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantMessage: GrokMessage = {
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        };
        setGrokMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Grok API error');
      }
    } catch (error) {
      toast({
        title: "Grok Error",
        description: "Failed to get response from Grok",
        variant: "destructive",
      });
    } finally {
      setIsGrokLoading(false);
    }
  };

  // Code Amendment Function
  const amendCode = async () => {
    if (!codeToAmend || !errorToFix) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/grok/amend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filePath: codeToAmend,
          errorMessage: errorToFix
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Code Amendment Success",
          description: `Fixed ${codeToAmend} successfully`,
        });
        setShowCodeDialog(false);
        setCodeToAmend("");
        setErrorToFix("");
      } else {
        throw new Error('Amendment failed');
      }
    } catch (error) {
      toast({
        title: "Amendment Error",
        description: "Failed to amend code",
        variant: "destructive",
      });
    }
  };

  // Admin Settings Functions
  const handleSystemAction = (action: string) => {
    toast({
      title: "System Action",
      description: `Executing ${action}...`,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-white">
              <Shield className="w-6 h-6 text-blue-400" />
              Admin Dashboard Access
            </CardTitle>
            <CardDescription className="text-gray-300">
              Enter admin credentials to access Grok and system settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Admin Code</Label>
              <Input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                placeholder="Enter admin code (hint: admin)"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full bg-blue-600 hover:bg-blue-700">
              <Lock className="w-4 h-4 mr-2" />
              Access Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Grok Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Self-healing system & platform management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="px-3 py-1">
                <Activity className="w-3 h-3 mr-1" />
                ADMIN MODE
              </Badge>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('adminToken');
                  setIsAuthenticated(false);
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="grok-chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Grok Chat
            </TabsTrigger>
            <TabsTrigger value="code-tools">
              <Code className="w-4 h-4 mr-2" />
              Code Tools
            </TabsTrigger>
            <TabsTrigger value="system-settings">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Grok Chat Tab */}
          <TabsContent value="grok-chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  Grok AI Assistant
                </CardTitle>
                <CardDescription>
                  Chat with Grok for code fixes, enhancements, and system management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {grokMessages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Bot className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Start a conversation with Grok</p>
                      </div>
                    ) : (
                      grokMessages.map((message, index) => (
                        <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    {isGrokLoading && (
                      <div className="text-left">
                        <div className="inline-block bg-white border border-gray-200 px-4 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span className="text-sm text-gray-600">Grok is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={grokInput}
                      onChange={(e) => setGrokInput(e.target.value)}
                      placeholder="Ask Grok to fix code, add features, or help with system management..."
                      className="min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendGrokMessage();
                        }
                      }}
                    />
                    <Button 
                      onClick={sendGrokMessage} 
                      disabled={isGrokLoading || !grokInput.trim()}
                      className="px-6"
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Tools Tab */}
          <TabsContent value="code-tools">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Code Amendment</CardTitle>
                  <CardDescription>Fix errors in specific files using Grok</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setShowCodeDialog(true)} className="w-full">
                    <Code className="w-4 h-4 mr-2" />
                    Amend Code File
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Monitor platform health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Grok API</span>
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database</span>
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Self-Healing</span>
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enabled
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system-settings">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSystemAction("API Configuration")}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    API Configuration
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSystemAction("Environment Variables")}
                  >
                    <Terminal className="w-4 h-4 mr-2" />
                    Environment Variables
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSystemAction("Security Settings")}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Security Settings
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSystemAction("Performance Monitoring")}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Performance Monitor
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSystemAction("Log Management")}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Log Management
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleSystemAction("Backup & Recovery")}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Backup & Recovery
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
                <CardDescription>Manage application data and chat history</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Database management tools are available. Use with caution in production.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    User management features are being developed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Code Amendment Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Amend Code File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>File Path</Label>
              <Input
                value={codeToAmend}
                onChange={(e) => setCodeToAmend(e.target.value)}
                placeholder="e.g., client/src/components/header.tsx"
              />
            </div>
            <div>
              <Label>Error Description</Label>
              <Textarea
                value={errorToFix}
                onChange={(e) => setErrorToFix(e.target.value)}
                placeholder="Describe the error or issue to fix..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={amendCode} disabled={!codeToAmend || !errorToFix}>
                <Code className="w-4 h-4 mr-2" />
                Fix Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
