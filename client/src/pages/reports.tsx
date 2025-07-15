import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  Building,
  Filter,
  Search,
  FileSpreadsheet,
  FileBarChart2,
  FileClock,
  CheckCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Report {
  id: string;
  name: string;
  type: 'cost-plan' | 'trade-breakdown' | 'progress' | 'aiqs-compliant';
  projectName: string;
  date: string;
  status: 'draft' | 'final';
  size: string;
}

export default function Reports() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Mock reports data - in production, this would come from backend
  const reports: Report[] = [
    {
      id: "1",
      name: "Starbucks Werribee - Elemental Cost Plan",
      type: "cost-plan",
      projectName: "Starbucks Werribee DT",
      date: new Date().toISOString(),
      status: "final",
      size: "245 KB"
    },
    {
      id: "2",
      name: "Kmart Gladstone - Trade Breakdown",
      type: "trade-breakdown",
      projectName: "Kmart Gladstone",
      date: new Date(Date.now() - 86400000).toISOString(),
      status: "final",
      size: "312 KB"
    },
    {
      id: "3",
      name: "Monthly Progress Report - January 2025",
      type: "progress",
      projectName: "All Projects",
      date: new Date(Date.now() - 172800000).toISOString(),
      status: "draft",
      size: "156 KB"
    },
    {
      id: "4",
      name: "AIQS Compliant Cost Plan - Current Project",
      type: "aiqs-compliant",
      projectName: "Current Project",
      date: new Date().toISOString(),
      status: "final",
      size: "428 KB"
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cost-plan': return <FileSpreadsheet className="w-4 h-4" />;
      case 'trade-breakdown': return <FileBarChart2 className="w-4 h-4" />;
      case 'progress': return <FileClock className="w-4 h-4" />;
      case 'aiqs-compliant': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cost-plan': return 'bg-blue-100 text-blue-800';
      case 'trade-breakdown': return 'bg-green-100 text-green-800';
      case 'progress': return 'bg-orange-100 text-orange-800';
      case 'aiqs-compliant': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePreview = (report: Report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };

  const generatePDF = (report: Report) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("EstiMate", 20, 20);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(report.name, 20, 35);
    
    // Report info
    doc.setFontSize(10);
    doc.text(`Project: ${report.projectName}`, 20, 50);
    doc.text(`Date: ${formatDate(report.date)}`, 20, 57);
    doc.text(`Status: ${report.status.toUpperCase()}`, 20, 64);
    
    // Add content based on report type
    if (report.type === 'cost-plan') {
      doc.autoTable({
        startY: 80,
        head: [['Element', 'Description', 'Quantity', 'Rate', 'Total']],
        body: [
          ['Substructure', 'Concrete slab on ground', '285 m²', '$165/m²', '$47,025'],
          ['Superstructure', 'Structural steel frame', '8.5 t', '$3,200/t', '$27,200'],
          ['External Walls', 'Precast concrete panels', '420 m²', '$320/m²', '$134,400'],
          ['Windows & Doors', 'Commercial glazing system', '85 m²', '$650/m²', '$55,250'],
          ['Internal Walls', 'Steel stud partitions', '180 m²', '$85/m²', '$15,300'],
          ['MEP Services', 'Complete M&E fitout', '285 m²', '$420/m²', '$119,700'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });
      
      // Total
      doc.setFont("helvetica", "bold");
      doc.text('Total Construction Cost: $1,324,750', 20, doc.lastAutoTable.finalY + 20);
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text('Generated by EstiMate - Professional Construction Cost Estimation Platform', 20, 280);
    
    return doc;
  };

  const handleDownload = (report: Report) => {
    const doc = generatePDF(report);
    doc.save(`${report.name.replace(/\s+/g, '_')}.pdf`);
    
    toast({
      title: "Report downloaded",
      description: `${report.name} has been saved to your downloads folder.`,
    });
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || report.type === filterType;
    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2 bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            </div>
            <Button
              onClick={() => navigate('/reports/new')}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">Search reports</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cost-plan">Cost Plan</SelectItem>
                    <SelectItem value="trade-breakdown">Trade Breakdown</SelectItem>
                    <SelectItem value="progress">Progress Report</SelectItem>
                    <SelectItem value="aiqs-compliant">AIQS Compliant</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid gap-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${getTypeColor(report.type)}`}>
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {report.projectName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(report.date)}
                            </span>
                            <span>{report.size}</span>
                          </div>
                          <div className="mt-2">
                            <Badge 
                              variant={report.status === 'final' ? 'default' : 'secondary'}
                              className={report.status === 'final' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {report.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Preview of the report content
            </DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="mt-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Report Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Project</p>
                    <p className="font-medium">{selectedReport.projectName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-medium capitalize">{selectedReport.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Generated</p>
                    <p className="font-medium">{formatDate(selectedReport.date)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium capitalize">{selectedReport.status}</p>
                  </div>
                </div>
              </div>
              
              {selectedReport.type === 'cost-plan' && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Elemental Cost Breakdown</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Element</th>
                        <th className="text-right py-2">Cost</th>
                        <th className="text-right py-2">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Substructure</td>
                        <td className="text-right">$47,025</td>
                        <td className="text-right">3.5%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Superstructure</td>
                        <td className="text-right">$27,200</td>
                        <td className="text-right">2.1%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">External Works</td>
                        <td className="text-right">$134,400</td>
                        <td className="text-right">10.1%</td>
                      </tr>
                      <tr className="border-b font-semibold">
                        <td className="py-2">Total</td>
                        <td className="text-right">$1,324,750</td>
                        <td className="text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button onClick={() => handleDownload(selectedReport)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}