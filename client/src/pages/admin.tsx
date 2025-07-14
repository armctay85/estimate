import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, Database, Users, FileSpreadsheet, Settings, 
  Shield, FolderPlus, Download, Trash2, Eye, Edit,
  CheckCircle, AlertTriangle, Info, Lock, Key
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("data-library");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [currentUpload, setCurrentUpload] = useState<string>("");
  const [uploadStats, setUploadStats] = useState({ processed: 0, total: 0, failed: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Simple admin authentication
  const handleAdminLogin = () => {
    // Check for admin access code (you can change this)
    if (adminCode === "ESTIMATE-ADMIN-2025") {
      setIsAuthenticated(true);
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the admin dashboard",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin code",
        variant: "destructive",
      });
    }
  };

  // Handle multiple file uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const totalFiles = files.length;
    let processed = 0;
    let failed = 0;
    
    setUploadStats({ processed: 0, total: totalFiles, failed: 0 });

    // Check for duplicates first
    const existingFileNames = uploadedFiles.map(f => f.name);
    const newFiles = fileArray.filter(file => !existingFileNames.includes(file.name));
    const duplicates = fileArray.filter(file => existingFileNames.includes(file.name));
    
    if (duplicates.length > 0) {
      const proceed = window.confirm(
        `${duplicates.length} files already uploaded:\n${duplicates.map(f => f.name).join('\n')}\n\nSkip duplicates and upload ${newFiles.length} new files?`
      );
      if (!proceed) {
        setIsUploading(false);
        return;
      }
    }
    
    const filesToUpload = newFiles.length > 0 ? newFiles : fileArray;
    setUploadStats({ processed: 0, total: filesToUpload.length, failed: 0 });
    
    // Process files in parallel batches of 6 for maximum speed
    const batchSize = 6;
    
    for (let i = 0; i < filesToUpload.length; i += batchSize) {
      const batch = filesToUpload.slice(i, i + batchSize);
      
      const uploadPromises = batch.map(async (file) => {
        try {
          setCurrentUpload(file.name);
          
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "design-library");
          
          const response = await fetch("/api/admin/upload-design", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          
          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          setUploadedFiles(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + " MB",
            type: file.name.split('.').pop(),
            uploadDate: new Date().toISOString(),
            status: "processed"
          }]);
          
          return { success: true, file: file.name };
        } catch (error) {
          console.error("Upload failed:", error);
          return { success: false, file: file.name, error };
        }
      });
      
      // Wait for batch to complete
      const results = await Promise.all(uploadPromises);
      
      // Update stats
      const batchSuccess = results.filter(r => r.success).length;
      const batchFailed = results.filter(r => !r.success).length;
      
      processed += batchSuccess;
      failed += batchFailed;
      
      setUploadStats({ processed, total: filesToUpload.length, failed });
      setUploadProgress((processed / filesToUpload.length) * 100);
    }

    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUpload("");
    
    // Show final results
    if (failed === 0) {
      toast({
        title: "All Files Uploaded Successfully!",
        description: `${processed} files processed successfully`,
      });
    } else {
      toast({
        title: "Upload Complete with Errors",
        description: `${processed} successful, ${failed} failed`,
        variant: failed > processed / 2 ? "destructive" : "default",
      });
    }
  };

  // Mock data for admin stats
  const stats = {
    totalProjects: 1247,
    activeUsers: 423,
    designLibraries: uploadedFiles.length + 30,
    revenue: 125430
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              Enter your admin access code to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Code</label>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin access code"
              />
            </div>
            <Button onClick={handleAdminLogin} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Access Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-red-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage EstiMate platform data and settings</p>
            </div>
            <Badge variant="destructive" className="text-lg px-4 py-2">
              ADMIN ACCESS
            </Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.totalProjects.toLocaleString()}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Design Libraries</p>
                  <p className="text-2xl font-bold">{stats.designLibraries}</p>
                </div>
                <FileSpreadsheet className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue (Month)</p>
                  <p className="text-2xl font-bold">${stats.revenue.toLocaleString()}</p>
                </div>
                <Badge className="bg-green-500">+12.5%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="data-library">Data Library</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          {/* Data Library Tab */}
          <TabsContent value="data-library">
            <Card>
              <CardHeader>
                <CardTitle>Design Data Library Management</CardTitle>
                <CardDescription>
                  Upload and manage construction design libraries. Supports Excel, CSV, PDF, and CAD files.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Design Libraries</h3>
                  <p className="text-gray-600 mb-4">
                    Upload multiple files at once. Supports .xlsx, .csv, .pdf, .dwg, .rvt files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".xlsx,.csv,.pdf,.dwg,.rvt,.dxf,.ifc"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Select Files from Computer
                  </Button>
                  
                  {isUploading && (
                    <div className="mt-4 space-y-3">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900">Upload Progress</span>
                          <span className="text-sm text-blue-700">{uploadStats.processed} of {uploadStats.total} files</span>
                        </div>
                        <Progress value={uploadProgress} className="mb-2" />
                        <div className="flex justify-between text-xs text-blue-600">
                          <span>Uploading: {currentUpload}</span>
                          <span>{Math.round(uploadProgress)}% complete</span>
                        </div>
                        {uploadStats.failed > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            {uploadStats.failed} files failed
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Uploaded Files List */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Uploaded Design Libraries</h3>
                  <div className="space-y-2">
                    {uploadedFiles.length === 0 ? (
                      <Alert>
                        <Info className="w-4 h-4" />
                        <AlertDescription>
                          No files uploaded yet. Click the button above to upload your design libraries.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      uploadedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">{file.size} • Uploaded {new Date(file.uploadDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Processed
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Existing Libraries */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pre-loaded Design Libraries</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Starbucks Drive-Through Templates</h4>
                        <p className="text-sm text-gray-600 mb-3">15 design variations • QSR specific</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Export</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Kmart Retail Fitout Standards</h4>
                        <p className="text-sm text-gray-600 mb-3">8 store layouts • 2024 standards</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Export</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Residential Construction Library</h4>
                        <p className="text-sm text-gray-600 mb-3">250+ house designs • All sizes</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Export</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Commercial Building Standards</h4>
                        <p className="text-sm text-gray-600 mb-3">120 office layouts • MEP included</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Export</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Total Registered Users</p>
                      <p className="text-2xl font-bold">423</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Pro Subscribers</p>
                      <p className="text-xl font-semibold text-green-600">127</p>
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      User management features are being developed. You can view user statistics above.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">1,247</p>
                      <p className="text-sm text-gray-600">Total Projects</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-green-600">$3.2M</p>
                      <p className="text-sm text-gray-600">Total Value</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-600">89%</p>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="w-4 h-4 mr-2" />
                    Database Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Key className="w-4 h-4 mr-2" />
                    API Keys Management
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Platform Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Back Button */}
        <div className="mt-8">
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}