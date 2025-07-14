import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Eye, 
  Download, 
  Clock, 
  FileText, 
  Box,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { ForgeViewer } from './forge-viewer';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SavedModel {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  fileSize: number;
  urn: string;
  status: 'processing' | 'complete' | 'failed';
  elementCount?: number;
  totalCost?: number;
}

export function ModelLibrary() {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<SavedModel | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      // Load from localStorage for now (in production, this would be an API call)
      const savedModels = localStorage.getItem('forge_models');
      if (savedModels) {
        setModels(JSON.parse(savedModels));
      } else {
        // Add some demo models
        const demoModels: SavedModel[] = [
          {
            id: '1',
            fileName: 'Starbucks Werribee DT.rvt',
            fileType: 'RVT',
            uploadDate: new Date(Date.now() - 86400000).toISOString(),
            fileSize: 45678912,
            urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDI1LTA0LTA5LTE3LTE4LTU5LWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL1N0YXJidWNrc1dlcnJpYmVlRFQucnZ0',
            status: 'complete',
            elementCount: 256,
            totalCost: 1320000
          },
          {
            id: '2',
            fileName: 'Kmart Gladstone.rvt',
            fileType: 'RVT',
            uploadDate: new Date(Date.now() - 172800000).toISOString(),
            fileSize: 89123456,
            urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDI1LTA0LTA5LTE3LTE5LTAwLWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL0ttYXJ0R2xhZHN0b25lLnJ2dA',
            status: 'complete',
            elementCount: 512,
            totalCost: 2420000
          },
          {
            id: '3',
            fileName: 'North Lakes Development.ifc',
            fileType: 'IFC',
            uploadDate: new Date(Date.now() - 259200000).toISOString(),
            fileSize: 34567890,
            urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDI1LTA0LTA5LTE3LTE5LTAxLWQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0MjdlL05vcnRoTGFrZXNEZXZlbG9wbWVudC5pZmM',
            status: 'complete',
            elementCount: 384,
            totalCost: 3850000
          }
        ];
        setModels(demoModels);
        localStorage.setItem('forge_models', JSON.stringify(demoModels));
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = model.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || model.fileType.toLowerCase() === filterType;
    return matchesSearch && matchesType;
  });

  const handleViewModel = (model: SavedModel) => {
    setSelectedModel(model);
    setViewerOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Model Library
          </CardTitle>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"

              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rvt">RVT</SelectItem>
                <SelectItem value="ifc">IFC</SelectItem>
                <SelectItem value="dwg">DWG</SelectItem>
                <SelectItem value="dxf">DXF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredModels.length === 0 ? (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {searchTerm || filterType !== 'all' 
                  ? 'No models found matching your criteria.' 
                  : 'No models uploaded yet. Upload a BIM file to get started.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => (
                <Card key={model.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm truncate max-w-[200px]" title={model.fileName}>
                          {model.fileName}
                        </h3>
                      </div>
                      <Badge variant={model.status === 'complete' ? 'default' : 'secondary'}>
                        {model.fileType}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(model.uploadDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{formatFileSize(model.fileSize)}</span>
                        {model.elementCount && (
                          <span>{model.elementCount} elements</span>
                        )}
                      </div>
                      {model.totalCost && (
                        <div className="font-medium text-foreground">
                          ${model.totalCost.toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleViewModel(model)}
                        disabled={model.status !== 'complete'}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View 3D
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Download functionality would go here
                          window.open(`/api/forge/download/${model.urn}`, '_blank');
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3D Viewer Dialog */}
      {selectedModel && (
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0" aria-describedby="model-viewer-description">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>
                {selectedModel.fileName}
              </DialogTitle>
              <div id="model-viewer-description" className="sr-only">
                3D model viewer for {selectedModel.fileName}
              </div>
            </DialogHeader>
            <div className="h-[70vh]">
              <ForgeViewer
                urn={selectedModel.urn}
                fileName={selectedModel.fileName}
                onClose={() => setViewerOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}