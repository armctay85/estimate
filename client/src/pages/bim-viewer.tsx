import { useEffect, useState } from 'react';
import { ForgeViewer } from '@/components/forge-viewer';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header';

export function BIMViewerPage() {
  const [urn, setUrn] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('BIM Model');

  useEffect(() => {
    // Get URN from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urnParam = urlParams.get('urn');
    const fileNameParam = urlParams.get('fileName');
    
    if (urnParam) {
      setUrn(urnParam);
    }
    
    if (fileNameParam) {
      setFileName(decodeURIComponent(fileNameParam));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/">
              <a className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </a>
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              BIM Model Viewer
            </h1>
            
            {urn ? (
              <div className="relative h-[600px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                <ForgeViewer 
                  urn={urn} 
                  fileName={fileName}
                  onClose={() => window.location.href = '/'}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] bg-gray-100 dark:bg-gray-900 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No model URN provided
                  </p>
                  <Link href="/">
                    <a className="text-blue-600 dark:text-blue-400 hover:underline">
                      Return to Dashboard
                    </a>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}