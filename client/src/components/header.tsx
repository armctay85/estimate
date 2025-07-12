// import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Compass, Crown, ChevronDown, LogOut, Settings, FolderOpen, FileBarChart } from "lucide-react";
import { useLocation } from "wouter";

export function Header() {
  // Bypass auth for demo mode
  const user = null;
  const logout = () => {};
  // const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const getSubscriptionBadge = () => {
    if (!user) return null;
    
    const tierConfig = {
      free: { label: "Free", variant: "secondary" as const },
      pro: { label: "Pro Plan", variant: "default" as const },
      premium: { label: "Premium", variant: "default" as const },
    };

    const config = tierConfig[user.subscriptionTier as keyof typeof tierConfig] || tierConfig.free;
    
    return (
      <Badge variant={config.variant} className="bg-green-100 text-green-800 hover:bg-green-200">
        {config.label === "Pro Plan" && <Crown className="w-3 h-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  const handleUpgrade = () => {
    setLocation("/subscribe");
  };

  if (!user) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/estimate-logo.jpg" 
                alt="EstiMate Logo" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">EstiMate</h1>
                <p className="text-xs text-gray-500">Australian Construction Estimator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img 
              src="/estimate-logo.jpg" 
              alt="EstiMate Logo" 
              className="h-12 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">EstiMate</h1>
              <p className="text-xs text-gray-500">Australian Construction Estimator</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {getSubscriptionBadge()}
            
            {user.subscriptionTier === 'free' && (
              <Button 
                variant="default"
                size="sm"
                onClick={handleUpgrade}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-700 hover:to-blue-800"
              >
                <Crown className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/projects")}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/reports")}>
                  <FileBarChart className="w-4 h-4 mr-2" />
                  Reports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/subscribe")}>
                  <Crown className="w-4 h-4 mr-2" />
                  Subscription
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
