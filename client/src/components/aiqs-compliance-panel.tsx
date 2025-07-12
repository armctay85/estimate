import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Award, 
  Building,
  Scale,
  DollarSign,
  Eye,
  Clock
} from "lucide-react";

interface AIQSComplianceProps {
  projectType: 'residential' | 'commercial' | 'industrial';
  projectValue: number;
  reportType: 'edc' | 'tax-depreciation' | 'construction-finance' | 'expert-witness';
}

export function AIQSCompliancePanel({ projectType, projectValue, reportType }: AIQSComplianceProps) {
  const [complianceDetails, setComplianceDetails] = useState(false);

  const getComplianceLevel = () => {
    switch (reportType) {
      case 'edc':
        return projectValue >= 3000000 ? 'MANDATORY_CQS' : 'RECOMMENDED_QS';
      case 'tax-depreciation':
        return 'TPB_REQUIRED';
      case 'construction-finance':
        return 'CQS_ONLY';
      case 'expert-witness':
        return 'CQS_COURT_QUALIFIED';
      default:
        return 'STANDARD';
    }
  };

  const getRequiredStandards = () => {
    const standards = [];
    
    if (reportType === 'edc') {
      standards.push({
        name: 'AIQS EDC Practice Standard 2nd Edition',
        status: 'COMPLIANT',
        description: 'NSW SSD and $3M+ project requirements',
        icon: FileText
      });
      
      if (projectValue >= 3000000) {
        standards.push({
          name: 'CQS Designation Required',
          status: 'VERIFIED',
          description: 'Certified Quantity Surveyor with NSW experience',
          icon: Award
        });
      }
    }

    if (reportType === 'tax-depreciation') {
      standards.push({
        name: 'TPB Registration',
        status: 'VERIFIED',
        description: 'Tax Practitioners Board compliance',
        icon: Shield
      });
      
      standards.push({
        name: 'AIQS Voting Member',
        status: 'VERIFIED',
        description: 'Associate/Member/Fellow grade required',
        icon: Award
      });
    }

    if (reportType === 'construction-finance') {
      standards.push({
        name: 'Construction Financing 4th Edition',
        status: 'COMPLIANT',
        description: 'Initial and Progress Report standards',
        icon: Building
      });
    }

    if (reportType === 'expert-witness') {
      standards.push({
        name: 'Expert Witness 2nd Edition',
        status: 'COMPLIANT',
        description: 'Court/tribunal compliance standards',
        icon: Scale
      });
    }

    // Universal standards
    standards.push({
      name: 'Professional Indemnity Insurance',
      status: 'VERIFIED',
      description: 'AIQS recommended coverage levels',
      icon: Shield
    });

    return standards;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getComplianceBadge = () => {
    const level = getComplianceLevel();
    const colors = {
      'MANDATORY_CQS': 'bg-red-100 text-red-800',
      'CQS_ONLY': 'bg-red-100 text-red-800',
      'CQS_COURT_QUALIFIED': 'bg-purple-100 text-purple-800',
      'TPB_REQUIRED': 'bg-blue-100 text-blue-800',
      'RECOMMENDED_QS': 'bg-green-100 text-green-800',
      'STANDARD': 'bg-gray-100 text-gray-800'
    };

    const labels = {
      'MANDATORY_CQS': 'CQS Required',
      'CQS_ONLY': 'CQS Only',
      'CQS_COURT_QUALIFIED': 'CQS + Court Qualified',
      'TPB_REQUIRED': 'TPB Required',
      'RECOMMENDED_QS': 'QS Recommended',
      'STANDARD': 'Standard QS'
    };

    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  const standards = getRequiredStandards();

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            AIQS Professional Compliance
          </div>
          {getComplianceBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Requirements */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-white rounded-lg border">
          <div className="text-center">
            <div className="text-sm text-gray-600">Project Type</div>
            <div className="font-semibold capitalize">{projectType}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Project Value</div>
            <div className="font-semibold">${projectValue.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Report Type</div>
            <div className="font-semibold capitalize">{reportType.replace('-', ' ')}</div>
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Required Standards</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setComplianceDetails(!complianceDetails)}
            >
              <Eye className="w-3 h-3 mr-1" />
              {complianceDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>
          
          {standards.map((standard, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <standard.icon className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="font-medium text-sm">{standard.name}</div>
                  {complianceDetails && (
                    <div className="text-xs text-gray-600">{standard.description}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(standard.status)}
                <span className="text-xs font-medium text-green-600">{standard.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Special Alerts */}
        {projectValue >= 3000000 && reportType === 'edc' && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>NSW SSD Project:</strong> CQS designation mandatory for projects over $3M. 
              Report must be submitted in AIQS standard form with Part 1 (public) and Part 2 (commercial-in-confidence).
            </AlertDescription>
          </Alert>
        )}

        {reportType === 'tax-depreciation' && (
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>TPB Compliance:</strong> Tax Practitioners Board registration required. 
              Must follow ATO rulings TR 97/23, TR 97/25, TR 2015/3, and TR 2022/1.
            </AlertDescription>
          </Alert>
        )}

        {/* Professional Verification */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Professional Verification</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600">VERIFIED</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>AIQS Membership:</span>
              <span className="font-medium">Fellow Grade</span>
            </div>
            <div className="flex justify-between">
              <span>CQS Designation:</span>
              <span className="font-medium">Certified</span>
            </div>
            <div className="flex justify-between">
              <span>Professional Insurance:</span>
              <span className="font-medium">$5M Coverage</span>
            </div>
            <div className="flex justify-between">
              <span>NSW Experience:</span>
              <span className="font-medium">15+ Years</span>
            </div>
          </div>
        </div>

        {/* Generate Report Button */}
        <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          <FileText className="w-4 h-4 mr-2" />
          Generate AIQS Compliant Report
        </Button>
      </CardContent>
    </Card>
  );
}