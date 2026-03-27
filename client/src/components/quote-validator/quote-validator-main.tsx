import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuoteUploadModal } from "./quote-upload-modal";
import { QuoteAnalyzer, type QuoteAnalysis } from "./quote-analyzer";
import { TrustScoreDisplay } from "./trust-score-display";
import { ElementalBreakdown } from "./elemental-breakdown";
import { NegotiationHelper, type NegotiationPoint } from "./negotiation-helper";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  BarChart3,
  MessageSquare,
  Trash2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteValidatorProps {
  projectId: number;
}

interface StoredQuote {
  id: number;
  builderName: string;
  date: string;
  totalAmount: number;
  trustScore: number;
  verdict: string;
  createdAt: string;
}

interface ElementalItem {
  elementCode: string;
  elementName: string;
  category: string;
  quoteAmount: number;
  marketAmount: number;
  variance: number;
  variancePercent: string;
  flag: 'ok' | 'warning' | 'critical';
  percentOfTotal: number;
}

export function QuoteValidator({ projectId }: QuoteValidatorProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<QuoteAnalysis | null>(null);
  const [negotiationPoints, setNegotiationPoints] = useState<NegotiationPoint[]>([]);
  const [elementalBreakdown, setElementalBreakdown] = useState<ElementalItem[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<StoredQuote[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();

  const handleAnalyze = async (quote: { items: any[]; totalAmount: number; builderName?: string; date?: string }, source: 'upload' | 'manual') => {
    setIsAnalyzing(true);
    setIsUploadModalOpen(false);
    
    try {
      const response = await apiRequest('POST', '/api/quotes/analyze', {
        projectId,
        items: quote.items,
        builderName: quote.builderName,
        date: quote.date
      });

      const data = await response.json();
      
      setCurrentAnalysis({
        trustScore: data.trustScore,
        verdict: data.verdict,
        items: data.items,
        summaryFlags: data.summaryFlags,
        laborPercentage: data.laborPercentage,
        materialPercentage: data.materialPercentage,
        hasContingency: data.hasContingency,
        contingencyAmount: data.contingencyAmount,
        totalQuoteAmount: data.totalQuoteAmount,
        estimatedMarketTotal: data.estimatedMarketTotal,
        potentialSavings: data.potentialSavings
      });
      
      setNegotiationPoints(data.negotiationPoints);
      setElementalBreakdown(data.elementalBreakdown);
      setActiveTab('analysis');
      
      // Refresh saved quotes list
      fetchSavedQuotes();
      
      toast({
        title: "Quote Analyzed",
        description: `Trust Score: ${data.trustScore}/100 - ${data.verdict}`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze quote",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchSavedQuotes = async () => {
    try {
      const response = await apiRequest('GET', `/api/projects/${projectId}/quotes`);
      const data = await response.json();
      setSavedQuotes(data);
    } catch (error) {
      console.error("Failed to fetch quotes:", error);
    }
  };

  const loadQuote = async (quoteId: number) => {
    try {
      setIsAnalyzing(true);
      const response = await apiRequest('GET', `/api/quotes/${quoteId}`);
      const data = await response.json();
      
      setCurrentAnalysis(data.analysis);
      setNegotiationPoints(data.negotiationPoints);
      setElementalBreakdown(data.elementalBreakdown);
      setActiveTab('analysis');
      
      toast({
        title: "Quote Loaded",
        description: `${data.builderName} - $${data.analysis.totalQuoteAmount.toLocaleString()}`
      });
    } catch (error) {
      toast({
        title: "Failed to Load",
        description: "Could not load the selected quote",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteQuote = async (quoteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this quote?')) {
      return;
    }
    
    try {
      await apiRequest('DELETE', `/api/quotes/${quoteId}`);
      setSavedQuotes(prev => prev.filter(q => q.id !== quoteId));
      toast({
        title: "Quote Deleted",
        description: "The quote has been removed"
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete the quote",
        variant: "destructive"
      });
    }
  };

  // Load saved quotes on mount
  useState(() => {
    fetchSavedQuotes();
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Quote Validator
          </h2>
          <p className="text-gray-600">
            Upload your builder quote and get an instant trust score
          </p>
        </div>
        
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              {currentAnalysis ? 'Analyze New Quote' : 'Upload Quote'}
            </>
          )}
        </Button>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            disabled={!currentAnalysis}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="breakdown" 
            disabled={!currentAnalysis}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Breakdown
          </TabsTrigger>
          <TabsTrigger 
            value="negotiate" 
            disabled={!currentAnalysis || negotiationPoints.length === 0}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Negotiate
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          {/* Intro Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-blue-50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Am I being ripped off?</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Upload your builder quote and our AI will analyze every line item against 
                current market rates. Get a trust score, identify red flags, and learn 
                how to negotiate.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> OCR Extraction
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Market Comparison
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Red Flag Detection
                </Badge>
              </div>

              <Button 
                size="lg"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Upload className="w-5 h-5" />
                Upload Quote
              </Button>
            </CardContent>
          </Card>

          {/* Saved Quotes */}
          {savedQuotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Previous Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedQuotes.map(quote => (
                    <div
                      key={quote.id}
                      onClick={() => loadQuote(quote.id)}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center font-bold",
                          getScoreColor(quote.trustScore)
                        )}>
                          {quote.trustScore}
                        </div>
                        <div>
                          <p className="font-medium">{quote.builderName}</p>
                          <p className="text-sm text-gray-500">
                            {quote.date} • ${quote.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={quote.trustScore >= 70 ? "default" : "destructive"}>
                          {quote.trustScore >= 90 ? 'Fair' : 
                           quote.trustScore >= 70 ? 'Review' : 
                           quote.trustScore >= 50 ? 'Concern' : 'High Risk'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => deleteQuote(quote.id, e)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* How It Works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold mb-2">Upload</h4>
                <p className="text-sm text-gray-600">
                  Upload a PDF or photo of your builder quote. Our OCR extracts all line items.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="font-semibold mb-2">Analyze</h4>
                <p className="text-sm text-gray-600">
                  AI compares each item against current market rates and identifies red flags.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold mb-2">Negotiate</h4>
                <p className="text-sm text-gray-600">
                  Get specific talking points and email templates to negotiate with confidence.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          {currentAnalysis && (
            <div className="space-y-6">
              <TrustScoreDisplay
                score={currentAnalysis.trustScore}
                verdict={currentAnalysis.verdict}
                totalQuote={currentAnalysis.totalQuoteAmount}
                marketEstimate={currentAnalysis.estimatedMarketTotal}
                variance={((currentAnalysis.totalQuoteAmount - currentAnalysis.estimatedMarketTotal) / currentAnalysis.estimatedMarketTotal) * 100}
              />

              <QuoteAnalyzer
                analysis={currentAnalysis}
                onRequestNegotiation={() => setActiveTab('negotiate')}
              />
            </div>
          )}
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown">
          {currentAnalysis && (
            <ElementalBreakdown
              items={elementalBreakdown}
              totalQuote={currentAnalysis.totalQuoteAmount}
              totalMarket={currentAnalysis.estimatedMarketTotal}
            />
          )}
        </TabsContent>

        {/* Negotiate Tab */}
        <TabsContent value="negotiate">
          {currentAnalysis && negotiationPoints.length > 0 && (
            <NegotiationHelper
              points={negotiationPoints}
              trustScore={currentAnalysis.trustScore}
              quoteTotal={currentAnalysis.totalQuoteAmount}
              marketTotal={currentAnalysis.estimatedMarketTotal}
            />
          )}
          
          {currentAnalysis && negotiationPoints.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Great news! This quote looks fair with no major negotiation points needed.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      <QuoteUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAnalyze={handleAnalyze}
        projectId={projectId}
      />
    </div>
  );
}
