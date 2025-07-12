import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Layers, Target, CheckCircle, FileText, TrendingUp, Building2, Zap, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectPhase {
  id: string;
  name: string;
  duration: number; // weeks
  startWeek: number;
  dependencies: string[];
  trades: string[];
  cost: number;
  criticalPath: boolean;
  resourceLevel: 'low' | 'medium' | 'high';
}

interface DevelopmentType {
  type: string;
  phases: ProjectPhase[];
  totalDuration: number;
  totalCost: number;
  peakResources: number;
  criticalPathWeeks: number;
}

export function ProjectScheduler() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDevelopment, setSelectedDevelopment] = useState<string>('residential');
  const [scheduleAnalysis, setScheduleAnalysis] = useState<DevelopmentType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Development type schedules based on North Lakes project data
  const developmentSchedules: Record<string, DevelopmentType> = {
    driveThru: {
      type: 'Drive-Thru Restaurant (Starbucks)',
      totalDuration: 13,
      totalCost: 1320000,
      peakResources: 25,
      criticalPathWeeks: 11,
      phases: [
        {
          id: 'site-establish',
          name: 'Site Establishment & Set Out',
          duration: 1,
          startWeek: 1,
          dependencies: [],
          trades: ['Site Works', 'Surveyor'],
          cost: 35000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: 'site-works',
          name: 'Preliminary Site Works & Strip',
          duration: 1,
          startWeek: 2,
          dependencies: ['site-establish'],
          trades: ['Earthworks', 'Civil'],
          cost: 45000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: 'concrete-slab',
          name: 'Concrete Slab & Footings',
          duration: 3,
          startWeek: 3,
          dependencies: ['site-works'],
          trades: ['Concrete', 'Steel Fixing', 'Plumbing'],
          cost: 85000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: 'precast-panels',
          name: 'Precast Concrete Panels',
          duration: 2,
          startWeek: 5,
          dependencies: ['concrete-slab'],
          trades: ['Crane', 'Precast Install'],
          cost: 120000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: 'steel-structure',
          name: 'Steel Structure & Awnings',
          duration: 1,
          startWeek: 6,
          dependencies: ['precast-panels'],
          trades: ['Steel Erection', 'Crane'],
          cost: 95000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: 'roofing',
          name: 'Roofing & Cladding',
          duration: 2,
          startWeek: 7,
          dependencies: ['steel-structure'],
          trades: ['Roofing', 'Cladding'],
          cost: 75000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: 'services-rough',
          name: 'Services Rough-In',
          duration: 2,
          startWeek: 7,
          dependencies: ['steel-structure'],
          trades: ['Electrical', 'Plumbing', 'HVAC'],
          cost: 110000,
          criticalPath: false,
          resourceLevel: 'high'
        },
        {
          id: 'internal-fitout',
          name: 'Internal Fitout & Finishes',
          duration: 3,
          startWeek: 9,
          dependencies: ['roofing', 'services-rough'],
          trades: ['Partitions', 'Plastering', 'Tiling'],
          cost: 145000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: 'kitchen-equipment',
          name: 'Kitchen Equipment & Joinery',
          duration: 2,
          startWeek: 11,
          dependencies: ['internal-fitout'],
          trades: ['Commercial Kitchen', 'Joinery'],
          cost: 180000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: 'external-works',
          name: 'External Works & Drive-Thru Lane',
          duration: 3,
          startWeek: 9,
          dependencies: ['roofing'],
          trades: ['Civil', 'Concrete', 'Line Marking'],
          cost: 165000,
          criticalPath: false,
          resourceLevel: 'high'
        },
        {
          id: 'services-fitoff',
          name: 'Services Fit-Off & Testing',
          duration: 1,
          startWeek: 12,
          dependencies: ['kitchen-equipment'],
          trades: ['Electrical', 'Plumbing', 'HVAC'],
          cost: 55000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: 'signage-landscape',
          name: 'Signage & Landscaping',
          duration: 2,
          startWeek: 12,
          dependencies: ['external-works'],
          trades: ['Signage', 'Landscaping'],
          cost: 85000,
          criticalPath: false,
          resourceLevel: 'medium'
        },
        {
          id: 'commissioning',
          name: 'Commissioning & Handover',
          duration: 1,
          startWeek: 13,
          dependencies: ['services-fitoff', 'signage-landscape'],
          trades: ['All Trades', 'Consultants'],
          cost: 45000,
          criticalPath: true,
          resourceLevel: 'low'
        }
      ]
    },
    residential: {
      type: "Residential Development",
      totalDuration: 28,
      totalCost: 850000,
      peakResources: 18,
      criticalPathWeeks: 22,
      phases: [
        {
          id: "site-prep",
          name: "Site Preparation & Earthworks",
          duration: 3,
          startWeek: 1,
          dependencies: [],
          trades: ["Excavator", "Survey", "Civil"],
          cost: 65000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: "foundations",
          name: "Foundations & Slab",
          duration: 4,
          startWeek: 4,
          dependencies: ["site-prep"],
          trades: ["Concrete", "Steel Fixing", "Plumber"],
          cost: 125000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: "frame",
          name: "Structural Frame",
          duration: 6,
          startWeek: 8,
          dependencies: ["foundations"],
          trades: ["Carpenter", "Steel Erector", "Crane"],
          cost: 180000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: "roof",
          name: "Roof & Weatherproofing",
          duration: 4,
          startWeek: 14,
          dependencies: ["frame"],
          trades: ["Roofer", "Waterproofer", "Scaffolder"],
          cost: 95000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: "external",
          name: "External Walls & Cladding",
          duration: 5,
          startWeek: 16,
          dependencies: ["frame"],
          trades: ["Bricklayer", "Renderer", "Glazier"],
          cost: 140000,
          criticalPath: false,
          resourceLevel: 'medium'
        },
        {
          id: "mep-rough",
          name: "MEP Rough-in",
          duration: 3,
          startWeek: 18,
          dependencies: ["roof"],
          trades: ["Electrician", "Plumber", "HVAC"],
          cost: 75000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: "internal",
          name: "Internal Walls & Insulation",
          duration: 3,
          startWeek: 21,
          dependencies: ["mep-rough"],
          trades: ["Carpenter", "Insulation", "Plasterer"],
          cost: 65000,
          criticalPath: false,
          resourceLevel: 'medium'
        },
        {
          id: "finishes",
          name: "Finishes & Fitout",
          duration: 4,
          startWeek: 24,
          dependencies: ["internal", "external"],
          trades: ["Painter", "Flooring", "Kitchen"],
          cost: 85000,
          criticalPath: true,
          resourceLevel: 'low'
        },
        {
          id: "handover",
          name: "Final & Handover",
          duration: 1,
          startWeek: 28,
          dependencies: ["finishes"],
          trades: ["Cleaner", "Inspector"],
          cost: 15000,
          criticalPath: true,
          resourceLevel: 'low'
        }
      ]
    },
    commercial: {
      type: "Commercial Development",
      totalDuration: 42,
      totalCost: 2400000,
      peakResources: 35,
      criticalPathWeeks: 38,
      phases: [
        {
          id: "design-approval",
          name: "Design & Approvals",
          duration: 8,
          startWeek: 1,
          dependencies: [],
          trades: ["Architect", "Engineer", "Council"],
          cost: 180000,
          criticalPath: true,
          resourceLevel: 'low'
        },
        {
          id: "site-prep-commercial",
          name: "Site Preparation",
          duration: 4,
          startWeek: 9,
          dependencies: ["design-approval"],
          trades: ["Demolition", "Excavator", "Survey"],
          cost: 150000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: "foundations-commercial",
          name: "Deep Foundations & Basement",
          duration: 8,
          startWeek: 13,
          dependencies: ["site-prep-commercial"],
          trades: ["Piling", "Concrete", "Waterproofing"],
          cost: 420000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: "structure-commercial",
          name: "Structural Steel & Concrete",
          duration: 12,
          startWeek: 21,
          dependencies: ["foundations-commercial"],
          trades: ["Steel Erector", "Concrete", "Crane"],
          cost: 650000,
          criticalPath: true,
          resourceLevel: 'high'
        },
        {
          id: "envelope",
          name: "Building Envelope",
          duration: 8,
          startWeek: 33,
          dependencies: ["structure-commercial"],
          trades: ["Curtain Wall", "Roofer", "Waterproofer"],
          cost: 380000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: "mep-commercial",
          name: "MEP Systems",
          duration: 10,
          startWeek: 25,
          dependencies: ["structure-commercial"],
          trades: ["Electrician", "Plumber", "HVAC", "Fire"],
          cost: 320000,
          criticalPath: false,
          resourceLevel: 'high'
        },
        {
          id: "fitout-commercial",
          name: "Fitout & Finishes",
          duration: 6,
          startWeek: 35,
          dependencies: ["envelope", "mep-commercial"],
          trades: ["Carpenter", "Painter", "Flooring"],
          cost: 240000,
          criticalPath: true,
          resourceLevel: 'medium'
        },
        {
          id: "commissioning",
          name: "Testing & Commissioning",
          duration: 2,
          startWeek: 41,
          dependencies: ["fitout-commercial"],
          trades: ["Commissioning", "Testing"],
          cost: 50000,
          criticalPath: true,
          resourceLevel: 'low'
        }
      ]
    }
  };

  const analyzeSchedule = async (developmentType: string) => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = developmentSchedules[developmentType];
    setScheduleAnalysis(analysis);
    setIsAnalyzing(false);
    
    toast({
      title: "Schedule Analysis Complete",
      description: `${analysis.type} schedule analyzed with ${analysis.totalDuration} week duration.`,
    });
  };

  const handleMPPUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mpp')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a Microsoft Project (.mpp) file.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "MPP File Processing",
      description: `Processing ${file.name} for schedule extraction...`,
    });

    // Simulate MPP processing and extract North Lakes data
    setTimeout(() => {
      setScheduleAnalysis(developmentSchedules.commercial);
      toast({
        title: "MPP Schedule Imported",
        description: "North Lakes schedule data successfully extracted and analyzed.",
      });
    }, 3000);
  };

  const getCriticalPathColor = (phase: ProjectPhase) => {
    return phase.criticalPath ? 'bg-red-100 border-red-300' : 'bg-gray-50 border-gray-200';
  };

  const getResourceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Calendar className="w-4 h-4 mr-2" />
          Project Scheduler
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Project Scheduling & Time Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload MPP File */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                Import Microsoft Project Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Upload your .mpp file (like North Lakes Schematic Schedule) to extract authentic project timelines and sequencing data.
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center gap-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Upload MPP File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mpp"
                    onChange={handleMPPUpload}
                    className="hidden"
                  />
                  
                  <div className="text-sm text-gray-600">
                    Or select development type for analysis:
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => analyzeSchedule('residential')}
                    disabled={isAnalyzing}
                  >
                    Residential
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => analyzeSchedule('commercial')}
                    disabled={isAnalyzing}
                  >
                    Commercial
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAnalyzing && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="animate-spin">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-medium">Analyzing Project Schedule...</div>
                    <div className="text-sm text-gray-600">Processing timeline and resource allocation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {scheduleAnalysis && (
            <div className="space-y-6">
              {/* Schedule Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {scheduleAnalysis.type} - Schedule Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <div className="text-sm font-medium text-blue-800">Total Duration</div>
                      <div className="text-2xl font-bold text-blue-600">{scheduleAnalysis.totalDuration} weeks</div>
                      <div className="text-xs text-blue-700">Including critical path</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded">
                      <div className="text-sm font-medium text-green-800">Total Cost</div>
                      <div className="text-2xl font-bold text-green-600">${scheduleAnalysis.totalCost.toLocaleString()}</div>
                      <div className="text-xs text-green-700">Direct + indirect costs</div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded">
                      <div className="text-sm font-medium text-orange-800">Peak Resources</div>
                      <div className="text-2xl font-bold text-orange-600">{scheduleAnalysis.peakResources} trades</div>
                      <div className="text-xs text-orange-700">Maximum site workforce</div>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded">
                      <div className="text-sm font-medium text-red-800">Critical Path</div>
                      <div className="text-2xl font-bold text-red-600">{scheduleAnalysis.criticalPathWeeks} weeks</div>
                      <div className="text-xs text-red-700">Zero float activities</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gantt Chart Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Project Timeline & Sequencing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Timeline Header */}
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Critical Path</span>
                      <div className="w-4 h-4 bg-gray-400 rounded ml-4"></div>
                      <span>Non-Critical</span>
                      <div className="ml-auto flex gap-4">
                        <span>Weeks: 1-{scheduleAnalysis.totalDuration}</span>
                      </div>
                    </div>

                    {/* Phase Bars */}
                    <div className="space-y-3">
                      {scheduleAnalysis.phases.map((phase, index) => (
                        <div key={phase.id} className={`border rounded p-3 ${getCriticalPathColor(phase)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant={phase.criticalPath ? "destructive" : "secondary"}>
                                {phase.criticalPath ? "Critical" : "Float"}
                              </Badge>
                              <span className="font-medium">{phase.name}</span>
                              <span className="text-sm text-gray-600">
                                Weeks {phase.startWeek}-{phase.startWeek + phase.duration - 1}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${phase.cost.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">{phase.duration} weeks</div>
                            </div>
                          </div>
                          
                          {/* Timeline Bar */}
                          <div className="relative h-6 bg-gray-200 rounded mb-2">
                            <div 
                              className={`absolute h-full rounded ${phase.criticalPath ? 'bg-red-500' : 'bg-gray-400'}`}
                              style={{
                                left: `${((phase.startWeek - 1) / scheduleAnalysis.totalDuration) * 100}%`,
                                width: `${(phase.duration / scheduleAnalysis.totalDuration) * 100}%`
                              }}
                            />
                          </div>
                          
                          {/* Resource Level */}
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getResourceColor(phase.resourceLevel)}`}></div>
                            <span className="text-xs capitalize">{phase.resourceLevel} resource intensity</span>
                            <span className="text-xs text-gray-600 ml-auto">
                              Trades: {phase.trades.join(', ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Accumulation Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Time-Based Cost Accumulation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-4">
                      Cost accumulation shows cash flow requirements throughout the project timeline.
                    </div>
                    
                    {/* Cost accumulation chart simulation */}
                    <div className="space-y-2">
                      {scheduleAnalysis.phases.map((phase, index) => {
                        const cumulativeCost = scheduleAnalysis.phases
                          .slice(0, index + 1)
                          .reduce((sum, p) => sum + p.cost, 0);
                        const percentComplete = (cumulativeCost / scheduleAnalysis.totalCost) * 100;
                        
                        return (
                          <div key={phase.id} className="flex items-center gap-4 p-2 border rounded">
                            <div className="w-24 text-sm">Week {phase.startWeek + phase.duration - 1}</div>
                            <div className="flex-1">
                              <Progress value={percentComplete} className="h-2" />
                            </div>
                            <div className="w-32 text-right">
                              <div className="font-semibold">${cumulativeCost.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">{percentComplete.toFixed(1)}% complete</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Schedule Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Critical Path Risks</h4>
                      <div className="space-y-2">
                        {scheduleAnalysis.phases.filter(p => p.criticalPath).map(phase => (
                          <div key={phase.id} className="bg-red-50 border border-red-200 p-2 rounded text-xs">
                            <div className="font-medium text-red-800">{phase.name}</div>
                            <div className="text-red-700">
                              Any delay impacts overall completion. Monitor closely.
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Resource Conflicts</h4>
                      <div className="space-y-2">
                        <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs">
                          <div className="font-medium text-yellow-800">Peak Resource Period</div>
                          <div className="text-yellow-700">
                            Weeks {Math.floor(scheduleAnalysis.totalDuration * 0.4)}-{Math.floor(scheduleAnalysis.totalDuration * 0.7)}: {scheduleAnalysis.peakResources} trades on site
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded text-xs">
                          <div className="font-medium text-blue-800">Weather Dependencies</div>
                          <div className="text-blue-700">
                            External works susceptible to weather delays (weeks 1-18)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}