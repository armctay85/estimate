import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  Copy, 
  CheckCircle,
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Send,
  Wand2
} from "lucide-react";

interface NegotiationPoint {
  id: string;
  item: string;
  issue: string;
  suggestion: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  category: 'price' | 'scope' | 'terms' | 'timing';
}

interface NegotiationHelperProps {
  points: NegotiationPoint[];
  trustScore: number;
  builderName?: string;
  quoteTotal: number;
  marketTotal: number;
}

export function NegotiationHelper({ 
  points, 
  trustScore, 
  builderName = 'the builder',
  quoteTotal,
  marketTotal 
}: NegotiationHelperProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [customMessage, setCustomMessage] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPoints = selectedCategory === 'all' 
    ? points 
    : points.filter(p => p.category === selectedCategory);

  const highPriorityCount = points.filter(p => p.priority === 'high').length;
  const totalSavings = quoteTotal - marketTotal;

  const generateEmailTemplate = () => {
    const highPriority = points.filter(p => p.priority === 'high');
    const mediumPriority = points.filter(p => p.priority === 'medium');

    return `Hi ${builderName},

Thank you for the detailed quote. I've reviewed the pricing and have a few questions:

${highPriority.map(p => `• ${p.question}`).join('\n')}

${mediumPriority.length > 0 ? `Additional points:\n${mediumPriority.slice(0, 3).map(p => `• ${p.question}`).join('\n')}` : ''}

Based on current market rates, the total appears to be approximately ${((quoteTotal - marketTotal) / marketTotal * 100).toFixed(0)}% above comparable projects. I'd appreciate it if we could discuss these items.

Looking forward to your response.

Best regards`;
  };

  const categories = [
    { id: 'all', label: 'All Points', count: points.length },
    { id: 'price', label: 'Pricing', count: points.filter(p => p.category === 'price').length },
    { id: 'scope', label: 'Scope', count: points.filter(p => p.category === 'scope').length },
    { id: 'terms', label: 'Terms', count: points.filter(p => p.category === 'terms').length },
    { id: 'timing', label: 'Timing', count: points.filter(p => p.category === 'timing').length },
  ];

  const getPriorityColor = (priority: NegotiationPoint['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: NegotiationPoint['category']) => {
    switch (category) {
      case 'price': return '💰';
      case 'scope': return '📋';
      case 'terms': return '📝';
      case 'timing': return '⏰';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className={cn(
        "border-2",
        trustScore >= 70 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Negotiation Assistant</h3>
              <p className="text-sm text-gray-600">
                {points.length} talking points identified • {highPriorityCount} high priority
                {totalSavings > 0 && ` • Potential savings: $${totalSavings.toLocaleString()}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Negotiation Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Lead with facts, not emotions</p>
              <p className="text-xs text-gray-600">
                Reference specific market rates and elemental costs. Use data from Rawlinsons or Altus.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Bundle related items</p>
              <p className="text-xs text-gray-600">
                Group multiple high-priced items together. Builders are more likely to negotiate on volume.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Ask for alternatives</p>
              <p className="text-xs text-gray-600">
                "What options do we have to reduce this cost?" opens the door to value engineering.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="text-xs"
          >
            {getCategoryIcon(cat.id as NegotiationPoint['category']) || '📌'} {cat.label}
            <Badge variant="secondary" className="ml-1 text-xs">
              {cat.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Negotiation Points */}
      <div className="space-y-3">
        {filteredPoints.map((point) => (
          <Card key={point.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(point.priority)}>
                      {point.priority.toUpperCase()}
                    </Badge>
                    <span className="text-lg">{getCategoryIcon(point.category)}</span>
                    <span className="font-medium">{point.item}</span>
                  </div>

                  <div className="pl-0 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{point.issue}</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{point.suggestion}</p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mt-2">
                      <p className="text-xs text-gray-500 mb-1">Suggested question:</p>
                      <p className="text-sm font-medium italic">"{point.question}"</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(point.question, point.id)}
                  className="flex-shrink-0"
                >
                  {copiedId === point.id ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPoints.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No negotiation points in this category.</p>
        </div>
      )}

      {/* Email Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4" />
            Ready-to-Send Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={customMessage || generateEmailTemplate()}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopy(customMessage || generateEmailTemplate(), 'email')}
              className="flex-1"
            >
              {copiedId === 'email' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setCustomMessage(generateEmailTemplate())}
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
