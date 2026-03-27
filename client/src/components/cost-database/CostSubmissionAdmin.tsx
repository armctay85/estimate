import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Building2, 
  DollarSign,
  MapPin,
  Star,
  Loader2
} from "lucide-react";

interface CostSubmission {
  id: number;
  elementId: number;
  elementName?: string;
  elementCode?: string;
  region: string;
  buildingType: string;
  quality: string;
  rate: string;
  quantity: string | null;
  totalCost: string | null;
  projectName: string | null;
  projectValue: string | null;
  projectDate: string | null;
  contractorName: string | null;
  projectDescription: string | null;
  submittedBy: number;
  submittedAt: string;
  status: string;
  verified: boolean;
  verifiedBy: number | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
  hasDocumentation: boolean;
  documentationUrl: string | null;
  isQsSubmitted: boolean;
}

export function CostSubmissionAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState<CostSubmission | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Fetch submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["/api/costs/submissions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/costs/submissions?limit=100");
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, approved, notes }: { id: number; approved: boolean; notes: string }) => {
      const res = await apiRequest("POST", `/api/costs/submissions/${id}/verify`, {
        reject: !approved,
        notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submission updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/costs/submissions"] });
      setSelectedSubmission(null);
      setVerificationNotes("");
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const pendingSubmissions = submissions.filter((s: CostSubmission) => s.status === "pending");
  const verifiedSubmissions = submissions.filter((s: CostSubmission) => s.status === "verified");
  const rejectedSubmissions = submissions.filter((s: CostSubmission) => s.status === "rejected");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleVerify = (approved: boolean) => {
    if (!selectedSubmission) return;
    verifyMutation.mutate({
      id: selectedSubmission.id,
      approved,
      notes: verificationNotes,
    });
  };

  const SubmissionCard = ({ submission }: { submission: CostSubmission }) => (
    <Card 
      className={`cursor-pointer transition-colors ${
        selectedSubmission?.id === submission.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => setSelectedSubmission(submission)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Element #{submission.elementId}</span>
              {submission.isQsSubmitted && (
                <Badge className="bg-purple-100 text-purple-800 text-xs">QS</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{submission.region}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />{submission.buildingType.replace("_", " ")}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />{submission.quality}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold">${parseFloat(submission.rate).toLocaleString()}</div>
            <div className="text-xs text-gray-500">{getStatusBadge(submission.status)}</div>
          </div>
        </div>
        
        {submission.projectName && (
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Project:</span> {submission.projectName}
          </div>
        )}
        
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
          <User className="w-3 h-3" />
          User #{submission.submittedBy}
          <span className="mx-1">•</span>
          {new Date(submission.submittedAt).toLocaleDateString()}
          {submission.hasDocumentation && (
            <>
              <span className="mx-1">•</span>
              <FileText className="w-3 h-3 inline mr-1" />Has docs
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      <div>
        <Tabs defaultValue="pending">
          <TabsList className="w-full">
            <TabsTrigger value="pending">
              Pending ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="verified">
              Verified ({verifiedSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2">
                {pendingSubmissions.map((submission: CostSubmission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
                {pendingSubmissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No pending submissions</div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="verified">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2">
                {verifiedSubmissions.map((submission: CostSubmission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rejected">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2">
                {rejectedSubmissions.map((submission: CostSubmission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        {selectedSubmission ? (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
              <CardDescription>
                Review and verify cost submission #{selectedSubmission.id}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Rate</label>
                  <div className="text-2xl font-bold">${parseFloat(selectedSubmission.rate).toLocaleString()}</div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Element ID</label>
                  <div className="font-medium">#{selectedSubmission.elementId}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Region</label>
                  <div className="font-medium">{selectedSubmission.region}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Building Type</label>
                  <div className="font-medium">{selectedSubmission.buildingType.replace("_", " ")}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Quality</label>
                  <div className="font-medium capitalize">{selectedSubmission.quality}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-500">Quantity</label>
                  <div className="font-medium">{selectedSubmission.quantity || "N/A"}</div>
                </div>
              </div>

              {selectedSubmission.projectName && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium">Project Information</h4>
                  <div><span className="text-gray-500">Name:</span> {selectedSubmission.projectName}</div>
                  {selectedSubmission.projectValue && (
                    <div><span className="text-gray-500">Value:</span> ${parseFloat(selectedSubmission.projectValue).toLocaleString()}</div>
                  )}
                  {selectedSubmission.contractorName && (
                    <div><span className="text-gray-500">Contractor:</span> {selectedSubmission.contractorName}</div>
                  )}
                  {selectedSubmission.projectDate && (
                    <div><span className="text-gray-500">Date:</span> {new Date(selectedSubmission.projectDate).toLocaleDateString()}</div>
                  )}
                </div>
              )}

              {selectedSubmission.projectDescription && (
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="text-sm">{selectedSubmission.projectDescription}</p>
                </div>
              )}

              {selectedSubmission.documentationUrl && (
                <div>
                  <label className="text-sm text-gray-500">Documentation</label>
                  <a 
                    href={selectedSubmission.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Documentation →
                  </a>
                </div>
              )}

              <div className="text-xs text-gray-400">
                Submitted by User #{selectedSubmission.submittedBy} on{" "}
                {new Date(selectedSubmission.submittedAt).toLocaleString()}
              </div>

              {selectedSubmission.status === "pending" && (
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <Label className="text-sm">Verification Notes</Label>
                    <Textarea
                      placeholder="Add notes about this submission..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleVerify(false)}
                      disabled={verifyMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleVerify(true)}
                      disabled={verifyMutation.isPending}
                    >
                      {verifyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Verify
                    </Button>
                  </div>
                </div>
              )}

              {selectedSubmission.verificationNotes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <label className="text-sm text-blue-800 font-medium">Verification Notes</label>
                  <p className="text-sm text-blue-700">{selectedSubmission.verificationNotes}</p>
                  {selectedSubmission.verifiedAt && (
                    <p className="text-xs text-blue-600 mt-1">
                      Verified on {new Date(selectedSubmission.verifiedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a submission to review</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
