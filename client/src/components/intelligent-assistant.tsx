import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Lightbulb, Settings, X, HelpCircle, Zap, Target } from "lucide-react";

interface AssistantMessage {
  id: string;
  type: 'assistant' | 'user' | 'tip';
  content: string;
  timestamp: Date;
}

interface AssistantContext {
  elementsCount: number;
  totalCost: number;
  lastAction: string | null;
  userLevel: 'beginner' | 'intermediate' | 'expert';
  enabled: boolean;
}

export function IntelligentAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [context, setContext] = useState<AssistantContext>({
    elementsCount: 0,
    totalCost: 0,
    lastAction: null,
    userLevel: 'beginner',
    enabled: JSON.parse(localStorage.getItem('aiAssistantEnabled') || 'true')
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (context.enabled && messages.length === 0) {
      addMessage('assistant', 
        "👋 Hi! I'm your EstiMate assistant. I can help you with drawing techniques, material selection, cost optimization, and professional QS workflows. What would you like to know?"
      );
    }
  }, [context.enabled]);

  const addMessage = (type: 'assistant' | 'user' | 'tip', content: string) => {
    const newMessage: AssistantMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleQuickHelp = (topic: string) => {
    let response = '';
    
    switch(topic) {
      case 'drawing':
        response = "🎨 **Drawing Tips:**\n• Use rectangle tool for rooms and walls\n• Circle tool for round features\n• Polygon for complex shapes\n• Hold Shift while drawing for perfect squares/circles\n• Use background images for tracing floor plans";
        break;
      case 'materials':
        response = "🏗️ **Material Selection:**\n• **Timber ($120/m²)** - Perfect for residential flooring\n• **Concrete ($165/m²)** - Commercial grade, high durability\n• **Tiles ($70/m²)** - Ideal for wet areas and high traffic\n• **Carpet ($43/m²)** - Cost-effective for bedrooms\n• **Vinyl ($28/m²)** - Budget-friendly option";
        break;
      case 'costing':
        response = "💰 **Cost Optimization:**\n• Accurate measurements = accurate costs\n• Include 15% overheads + 12% profit\n• Factor in 8% contingency for unknowns\n• Add 10% GST to final totals\n• Use calibration for precise measurements";
        break;
      case 'professional':
        response = "⭐ **Professional Workflows:**\n• Start with site survey and measurements\n• Create consistent naming conventions\n• Use templates for standard room types\n• Export detailed reports for clients\n• Upgrade to Pro for 200+ materials and BIM processing";
        break;
      case 'ai-features':
        response = "🤖 **AI-Powered Features:**\n• **AI Cost Predictor** - Regional cost estimates based on 10,000+ projects\n• **BIM Auto-Takeoff** - Upload CAD files for automatic element detection\n• **Smart Suggestions** - Context-aware tips as you work\n• **Professional Reports** - AIQS compliant cost plans";
        break;
    }
    
    addMessage('user', `Help with ${topic}`);
    setTimeout(() => addMessage('assistant', response), 500);
  };

  const showContextualTip = (elementsCount: number, totalCost: number) => {
    if (!context.enabled) return;
    
    if (elementsCount === 1 && context.elementsCount === 0) {
      addMessage('tip', "🎯 Great start! Your first element is drawn. Try adding materials from the selector to see real-time cost calculations.");
    } else if (elementsCount === 3 && context.elementsCount < 3) {
      addMessage('tip', "🏗️ You're building a solid project! Consider using the AI Cost Predictor for quick estimates across different project types.");
    } else if (totalCost > 50000 && context.totalCost < 50000) {
      addMessage('tip', "💡 High-value project detected! Consider upgrading to Pro for professional QS reporting and detailed cost breakdowns.");
    }
    
    setContext(prev => ({ ...prev, elementsCount, totalCost }));
  };

  const toggleAssistant = () => {
    const newEnabled = !context.enabled;
    setContext(prev => ({ ...prev, enabled: newEnabled }));
    localStorage.setItem('aiAssistantEnabled', JSON.stringify(newEnabled));
    
    if (newEnabled) {
      addMessage('assistant', "AI Assistant enabled! I'm here to help optimize your workflow. 🚀");
    }
  };

  // Floating Assistant Button
  const AssistantButton = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg animate-pulse"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );

  if (!context.enabled) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleAssistant}
          variant="outline"
          className="w-14 h-14 rounded-full"
        >
          <MessageCircle className="w-6 h-6 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <AssistantButton />
      
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-50">
          <Card className="shadow-2xl border-emerald-200">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  EstiMate Assistant
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:bg-white/20"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.type === 'assistant' 
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : message.type === 'tip'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-blue-50 border border-blue-200 ml-8'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
              
              {showSettings && (
                <div className="border-t p-4 bg-gray-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">AI Assistant</span>
                      <Button
                        variant={context.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={toggleAssistant}
                      >
                        {context.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Experience Level</span>
                      <select
                        value={context.userLevel}
                        onChange={(e) => setContext(prev => ({ ...prev, userLevel: e.target.value as any }))}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickHelp('drawing')}
                    className="text-xs"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Drawing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickHelp('materials')}
                    className="text-xs"
                  >
                    <HelpCircle className="w-3 h-3 mr-1" />
                    Materials
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickHelp('costing')}
                    className="text-xs"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Costing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickHelp('ai-features')}
                    className="text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    AI Features
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}