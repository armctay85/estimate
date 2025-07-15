import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { AuthProvider } from "./hooks/use-auth";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Subscribe from "@/pages/subscribe";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import ThreeDProcessor from "@/pages/3d-processor";
import AdminDashboard from "@/pages/admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/projects" component={Projects} />
      <Route path="/project/:id" component={ProjectDetail} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/3d-processor" component={ThreeDProcessor} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
