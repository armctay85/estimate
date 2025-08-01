import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { AuthProvider } from "./hooks/use-auth";
import { Home } from "@/pages/home";
import Auth from "@/pages/auth";
import Subscribe from "@/pages/subscribe";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ThreeDProcessor from "@/pages/3d-processor";
import AdminDashboard from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { Sketch } from "@/pages/sketch";
import { Regulations } from "@/pages/regulations";
import { BIMViewerPage } from "@/pages/bim-viewer";
import { TestViewer } from "@/pages/test-viewer";
import { TestForge } from "@/pages/test-forge";
import LoginPage from "@/pages/LoginPage";
import AdminChat from "@/pages/AdminChat";
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

// Separate component for admin conditional to avoid parse issues
function AdminRoute() {
  const hasToken = !!localStorage.getItem('adminToken');
  console.log('Admin route check - hasToken:', hasToken, 'token:', localStorage.getItem('adminToken'));
  return hasToken ? <AdminChat /> : <LoginPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sketch" component={Sketch} />
      <Route path="/auth" component={Auth} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/projects" component={Projects} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/3d-processor" component={ThreeDProcessor} />
      <Route path="/admin" component={AdminRoute} />
      <Route path="/login" component={LoginPage} />
      <Route path="/regulations" component={Regulations} />
      <Route path="/bim-viewer" component={BIMViewerPage} />
      <Route path="/test-viewer" component={TestViewer} />
      <Route path="/test-forge" component={TestForge} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-200`}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="fixed top-4 right-4 z-50 p-2 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;