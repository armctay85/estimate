import { useState, useEffect } from "react";
import { ForgeViewer } from "@/components/forge-viewer";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function TestViewer() {
  const [, navigate] = useLocation();
  const [urn, setUrn] = useState<string>("");
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    // Get the stored URN from localStorage
    const storedUrn = localStorage.getItem('lastUploadedUrn') || localStorage.getItem('currentModelUrn') || "";
    const fileName = localStorage.getItem('lastUploadedFileName') || localStorage.getItem('currentModelFileName') || "No file";
    
    if (storedUrn) {
      setUrn(storedUrn);
      console.log('Found stored URN:', storedUrn);
      console.log('File name:', fileName);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto p-6">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">BIM Viewer Test Page</h1>
          
          {urn ? (
            <div>
              <p className="mb-4">Found previously uploaded file. URN: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{urn.substring(0, 50)}...</code></p>
              
              {!showViewer ? (
                <Button
                  onClick={() => setShowViewer(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Load 3D Model
                </Button>
              ) : (
                <ForgeViewer urn={urn} />
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No uploaded file found. Please upload a BIM file first.</p>
              <Button onClick={() => navigate("/")}>
                Go to Home Page
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}