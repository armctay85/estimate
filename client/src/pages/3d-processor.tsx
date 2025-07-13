import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Enhanced3DProcessor } from "@/components/enhanced-3d-processor";

export default function ThreeDProcessor() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              3D Wireframe Processor
            </h1>
            <p className="text-xl text-gray-600">
              Extract true wireframe geometry from CAD files
            </p>
          </div>

          <Enhanced3DProcessor />
        </div>
      </div>
    </div>
  );
}