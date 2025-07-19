import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { BIMUploadModal } from "@/components/BIMUploadModal";
import { Interactive3DModel } from "@/components/interactive-3d-model";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faFileUpload, faPenRuler, faCalculator, faCamera, faShield, faFileAlt, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { 
  PenTool, 
  Building2, 
  Calculator, 
  Camera, 
  Upload, 
  FileText, 
  Users, 
  Calendar,
  Crown,
  Star,
  ArrowRight,
  Zap,
  Shield
} from "lucide-react";
import { useLocation } from "wouter";

export function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showFixedBIMProcessor, setShowFixedBIMProcessor] = useState(false);

  // Subscription tier checking
  const canAccessFeature = (feature: string) => {
    const tier = localStorage.getItem('subscriptionTier') || 'free';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (isAdmin) return true;
    
    switch (feature) {
      case 'bim':
        return tier === 'enterprise';
      case 'pro-tools':
        return tier === 'pro' || tier === 'enterprise';
      default:
        return true;
    }
  };

  const handleUpgradePrompt = (feature: string) => {
    const tierNeeded = feature === 'bim' ? 'Enterprise' : 'Pro';
    toast({
      title: "Upgrade Required",
      description: `${tierNeeded} subscription needed for this feature.`,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <div className="container mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Professional Construction Cost Estimation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              AI-powered BIM processing, floor plan sketching, and Australian quantity surveying
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Button
                onClick={() => navigate("/sketch")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <PenTool className="w-4 h-4" />
                Start Floor Plan Sketch
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => {
                  if (canAccessFeature('bim')) {
                    setShowFixedBIMProcessor(true);
                  } else {
                    handleUpgradePrompt('bim');
                  }
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                <Building2 className="w-4 h-4" />
                Launch Enterprise BIM
                {!canAccessFeature('bim') && <Crown className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/projects")}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Projects
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  onClick={() => navigate("/sketch")}
                  title="Create floor plan sketches"
                >
                  <FontAwesomeIcon icon={faPenRuler} className="w-4 h-4 mr-2" />
                  Floor Plan Sketch
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                  onClick={() => {
                    if (canAccessFeature('pro-tools')) {
                      toast({ title: "Coming Soon", description: "AI Cost Predictor launching soon!" });
                    } else {
                      handleUpgradePrompt('pro-tools');
                    }
                  }}
                  title="AI-powered cost predictions"
                >
                  <FontAwesomeIcon icon={faCalculator} className="w-4 h-4 mr-2" />
                  AI Cost Predictor
                  {!canAccessFeature('pro-tools') && <Crown className="w-3 h-3 ml-auto" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200"
                  onClick={() => {
                    if (canAccessFeature('pro-tools')) {
                      toast({ title: "Coming Soon", description: "Photo Renovation AI launching soon!" });
                    } else {
                      handleUpgradePrompt('pro-tools');
                    }
                  }}
                  title="AI renovation from photos"
                >
                  <FontAwesomeIcon icon={faCamera} className="w-4 h-4 mr-2" />
                  Photo Renovation AI
                  {!canAccessFeature('pro-tools') && <Crown className="w-3 h-3 ml-auto" />}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                  onClick={() => navigate("/projects")}
                  title="View your recent projects"
                >
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 mr-2" />
                  Recent Projects
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200"
                  onClick={() => navigate("/regulations")}
                  title="Australian building regulations database"
                >
                  <FontAwesomeIcon icon={faShield} className="w-4 h-4 mr-2" />
                  Building Regulations
                  <Badge className="ml-auto" variant="secondary">AU</Badge>
                </Button>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Projects</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                  <Badge className="bg-green-100 text-green-800">$2.4M</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Accuracy</span>
                  <Badge className="bg-blue-100 text-blue-800">±2.1%</Badge>
                </div>
                
                {/* Upgrade Prompt for Free Users */}
                {!canAccessFeature('pro-tools') && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-800 dark:text-orange-200">Upgrade Available</span>
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-2">
                      Unlock professional QS tools and AI features
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => navigate("/subscribe")}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 3D Model Display */}
          <div className="lg:col-span-2">
            <Interactive3DModel />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <PenTool className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-semibold mb-1">Floor Plan Sketch</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Draw rooms and assign materials
              </p>
              <Badge variant="secondary" className="mt-2">Free</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Calculator className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-semibold mb-1">Professional QS Tools</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                200+ Australian materials & rates
              </p>
              <Badge className="mt-2 bg-blue-100 text-blue-800">Pro</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold mb-1">BIM Auto-Takeoff</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI-powered CAD/BIM processing
              </p>
              <Badge className="mt-2 bg-purple-100 text-purple-800">Enterprise</Badge>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <Camera className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <h3 className="font-semibold mb-1">Photo Renovation</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI renovation cost analysis
              </p>
              <Badge className="mt-2 bg-orange-100 text-orange-800">Pro</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BIM Upload Modal - Grok's Fixed Version */}
      <BIMUploadModal
        isOpen={showFixedBIMProcessor}
        onClose={() => setShowFixedBIMProcessor(false)}
        onUploadSuccess={(urn) => {
          console.log('BIM upload successful, URN:', urn);
          toast({
            title: "BIM Upload Successful",
            description: "File uploaded and translation started successfully",
          });
        }}
      />
    </div>
  );
}