import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Zap, Building, Camera, FileText, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ServiceStatus {
  xai: boolean;
  openai: boolean;
  forge: boolean;
}

export function ServiceStatusDashboard() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    xai: false,
    openai: false,
    forge: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkServices = async () => {
      try {
        const response = await apiRequest('GET', '/api/service-status');
        const data = await response.json();
        console.log('Service status data:', data);
        setServiceStatus(data);
      } catch (error) {
        console.error('Failed to check service status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkServices();
    
    // Refresh status every 30 seconds
    const interval = setInterval(checkServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    {
      name: "X AI (Grok)",
      key: "xai" as keyof ServiceStatus,
      icon: <Zap className="w-4 h-4" />,
      description: "Advanced AI cost predictions and analysis",
      features: ["Cost Prediction", "BIM Analysis", "QS Reports"]
    },
    {
      name: "OpenAI (GPT-4)",
      key: "openai" as keyof ServiceStatus,
      icon: <Camera className="w-4 h-4" />,
      description: "Vision AI for photo renovation analysis", 
      features: ["Photo Analysis", "Vision Processing", "Renovation Plans"]
    },
    {
      name: "Autodesk Forge",
      key: "forge" as keyof ServiceStatus,
      icon: <Building className="w-4 h-4" />,
      description: "Professional BIM/CAD file processing",
      features: ["RVT Processing", "3D Visualization", "Model Translation"]
    }
  ];

  const getServiceCount = () => {
    return Object.values(serviceStatus).filter(Boolean).length;
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm">Checking service status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Enterprise Services Status
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-md">
            {getServiceCount()}/3 Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map(service => (
            <div key={service.key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="text-blue-600 dark:text-blue-400">{service.icon}</div>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{service.name}</span>
                </div>
                {serviceStatus[service.key] ? (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2 font-medium">{service.description}</p>
              <div className="flex flex-wrap gap-1">
                {service.features.map(feature => (
                  <Badge 
                    key={feature} 
                    variant="secondary" 
                    className={`text-xs font-medium ${serviceStatus[service.key] ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500'}`}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {getServiceCount() === 3 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">All Enterprise Services Active</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-medium">
              Platform operating at maximum capability with full AI and BIM processing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}