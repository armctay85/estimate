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
        setServiceStatus(response);
      } catch (error) {
        console.error('Failed to check service status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkServices();
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
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-purple-600" />
          Enterprise Services Status
          <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {getServiceCount()}/3 Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map(service => (
            <div key={service.key} className="bg-white rounded-lg p-4 border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {service.icon}
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                {serviceStatus[service.key] ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-600 mb-2">{service.description}</p>
              <div className="flex flex-wrap gap-1">
                {service.features.map(feature => (
                  <Badge 
                    key={feature} 
                    variant="secondary" 
                    className={`text-xs ${serviceStatus[service.key] ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {getServiceCount() === 3 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">All Enterprise Services Active</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Platform operating at maximum capability with full AI and BIM processing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}