import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Camera, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface ExtractedQuote {
  items: QuoteItem[];
  totalAmount: number;
  builderName?: string;
  date?: string;
}

interface QuoteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (quote: ExtractedQuote, source: 'upload' | 'manual') => void;
  projectId: number;
}

type UploadStep = 'idle' | 'uploading' | 'processing' | 'review' | 'manual';

export function QuoteUploadModal({ isOpen, onClose, onAnalyze, projectId }: QuoteUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedQuote, setExtractedQuote] = useState<ExtractedQuote | null>(null);
  const [manualItems, setManualItems] = useState<QuoteItem[]>([
    { description: '', quantity: 1, unit: 'm²', rate: 0, amount: 0 }
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    setError(null);
    setStep('uploading');
    setProgress(0);

    // Validate file
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG, WebP)');
      setStep('idle');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      setStep('idle');
      return;
    }

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 50));
    }, 200);

    try {
      // In production, this would upload to server and process with OCR
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(uploadInterval);
      setProgress(50);

      // Simulate OCR processing
      setStep('processing');
      const processInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 300);

      await new Promise(resolve => setTimeout(resolve, 3000));
      clearInterval(processInterval);

      // Mock extracted data - in production this comes from OCR + NLP
      const mockExtractedQuote: ExtractedQuote = {
        items: [
          { description: 'Concrete slab 200mm thick', quantity: 150, unit: 'm²', rate: 95, amount: 14250 },
          { description: 'Reinforcing steel mesh', quantity: 150, unit: 'm²', rate: 18, amount: 2700 },
          { description: 'Electrical rough-in', quantity: 150, unit: 'm²', rate: 180, amount: 27000 },
          { description: 'Plumbing rough-in', quantity: 150, unit: 'm²', rate: 145, amount: 21750 },
          { description: 'Wall framing', quantity: 85, unit: 'm²', rate: 125, amount: 10625 },
          { description: 'Ceiling framing', quantity: 150, unit: 'm²', rate: 45, amount: 6750 },
          { description: 'Joinery - kitchen', quantity: 1, unit: 'each', rate: 25000, amount: 25000 },
          { description: 'Floor tiling', quantity: 120, unit: 'm²', rate: 165, amount: 19800 },
          { description: 'Painting', quantity: 420, unit: 'm²', rate: 35, amount: 14700 },
        ],
        totalAmount: 142575,
        builderName: 'ABC Construction Pty Ltd',
        date: '2025-03-27',
      };

      setExtractedQuote(mockExtractedQuote);
      setProgress(100);
      setStep('review');
    } catch (err) {
      setError('Failed to process file. Please try again or enter manually.');
      setStep('idle');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const handleManualEntry = () => {
    setStep('manual');
    setError(null);
  };

  const addManualItem = () => {
    setManualItems(prev => [
      ...prev,
      { description: '', quantity: 1, unit: 'm²', rate: 0, amount: 0 }
    ]);
  };

  const updateManualItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    setManualItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Recalculate amount if quantity or rate changed
      if (field === 'quantity' || field === 'rate') {
        updated[index].amount = updated[index].quantity * updated[index].rate;
      }
      
      return updated;
    });
  };

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (step === 'review' && extractedQuote) {
      onAnalyze(extractedQuote, 'upload');
    } else if (step === 'manual') {
      const validItems = manualItems.filter(item => item.description && item.quantity > 0);
      const total = validItems.reduce((sum, item) => sum + item.amount, 0);
      onAnalyze({ items: validItems, totalAmount: total }, 'manual');
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('idle');
    setProgress(0);
    setError(null);
    setExtractedQuote(null);
    setManualItems([{ description: '', quantity: 1, unit: 'm²', rate: 0, amount: 0 }]);
    onClose();
  };

  const calculateTotal = () => {
    return manualItems.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'manual' ? (
              <Type className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
            {step === 'idle' && 'Upload Builder Quote'}
            {step === 'uploading' && 'Uploading File...'}
            {step === 'processing' && 'Analyzing Quote...'}
            {step === 'review' && 'Review Extracted Items'}
            {step === 'manual' && 'Manual Entry'}
          </DialogTitle>
          <DialogDescription>
            {step === 'idle' && 'Upload a PDF or photo of your builder quote to analyze'}
            {step === 'uploading' && 'Uploading your file to our secure servers'}
            {step === 'processing' && 'Using AI to extract and understand line items'}
            {step === 'review' && 'Review the extracted items before analysis'}
            {step === 'manual' && 'Enter quote line items manually'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'idle' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
                isDragging 
                  ? "border-primary bg-primary/5 scale-[1.02]" 
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              )}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your quote here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                PDF, JPG, PNG up to 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleManualEntry}
            >
              <Type className="w-4 h-4 mr-2" />
              Enter Items Manually
            </Button>
          </div>
        )}

        {(step === 'uploading' || step === 'processing') && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-sm text-gray-500">
              {step === 'uploading' ? 'Uploading...' : 'Processing with OCR and AI...'}
            </p>
            <p className="text-center text-xs text-gray-400">
              This may take a few moments depending on file size
            </p>
          </div>
        )}

        {step === 'review' && extractedQuote && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Builder:</span> {extractedQuote.builderName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {extractedQuote.date}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Items found:</span> {extractedQuote.items.length}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Rate</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedQuote.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-right">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right">${item.rate.toLocaleString()}</td>
                      <td className="p-3 text-right">${item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 sticky bottom-0">
                  <tr>
                    <td colSpan={3} className="p-3 font-semibold text-right">Total:</td>
                    <td className="p-3 font-semibold text-right">
                      ${extractedQuote.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                Please review the extracted items. If anything looks incorrect, 
                you can edit them in the next step or start over with manual entry.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleManualEntry}>
                Start Over (Manual)
              </Button>
              <Button onClick={handleConfirm}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Analyze Quote
              </Button>
            </div>
          </div>
        )}

        {step === 'manual' && (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {manualItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Description (e.g., Concrete slab 200mm)"
                      value={item.description}
                      onChange={(e) => updateManualItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateManualItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border rounded-md text-sm"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateManualItem(index, 'unit', e.target.value)}
                        className="w-24 px-3 py-2 border rounded-md text-sm"
                      >
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="lm">lm</option>
                        <option value="each">each</option>
                        <option value="hour">hour</option>
                        <option value="day">day</option>
                        <option value="week">week</option>
                        <option value="tonne">tonne</option>
                        <option value="kg">kg</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Rate ($)"
                        value={item.rate || ''}
                        onChange={(e) => updateManualItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 border rounded-md text-sm"
                      />
                      <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md text-sm min-w-[80px] justify-end">
                        ${item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {manualItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeManualItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addManualItem} className="w-full">
              + Add Item
            </Button>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-lg font-semibold">
                Total: ${calculateTotal().toLocaleString()}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('idle')}>
                  Back
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={manualItems.filter(i => i.description).length === 0}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Analyze Quote
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
