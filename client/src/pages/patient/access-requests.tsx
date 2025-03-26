import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { ApprovalModal } from "@/components/medical/approval-modal";
import { useToast } from "@/hooks/use-toast";
import { formatDate, getStatusBadgeColor } from "@/lib/utils";
import { AccessRequest } from "@shared/schema";
import { 
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PatientAccessRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // Fetch access requests for the patient
  const { data: requests, isLoading } = useQuery<(AccessRequest & {doctor?: any})[]>({
    queryKey: [`/api/access-requests/patient/${user?.id}`],
    enabled: !!user?.id,
  });

  // Sort requests by status and date
  // Ensure proper filtering of pending requests
  const pendingRequests = requests?.filter(req => req.status.toLowerCase() === "pending")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()) || [];
    
  // Debug to console
  console.log("Access requests:", requests);
  console.log("Pending requests:", pendingRequests);
  
  const approvedRequests = requests?.filter(req => req.status === "approved")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()) || [];
  
  const deniedRequests = requests?.filter(req => req.status === "denied")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()) || [];

  // Mutation to update access request status
  const updateAccessMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/access-requests/${id}`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      const action = variables.status === "approved" ? "approved" : "denied";
      toast({
        title: `Access request ${action}`,
        description: `You have ${action} the doctor's access request`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/access-requests/patient/${user?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers for quick actions
  const handleApprove = (request: AccessRequest) => {
    setSelectedRequest(request);
    setApprovalModalOpen(true);
  };

  const handleDeny = (id: number) => {
    updateAccessMutation.mutate({ id, status: "denied" });
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Requests</h1>
      </div>

      <Tabs defaultValue="pending" className="mb-6">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            Pending 
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center">
            <CheckCircle className="mr-1 h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="denied" className="flex items-center">
            <XCircle className="mr-1 h-4 w-4" />
            Denied
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            // Loading state
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <Card 
                key={request.id} 
                className="mb-4"
                data-doctor-name={request.doctor?.fullName}
                data-doctor-specialty={request.doctor?.specialty}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.doctor?.fullName || `Doctor #${request.doctorId}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.doctor?.specialty || "Healthcare Provider"}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={getStatusBadgeColor(request.status)}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.purpose}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requested Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.duration} days</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Request Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.requestDate)}</p>
                    </div>
                    {request.notes && (
                      <div className="md:col-span-2">
                        <p className="text-gray-500 dark:text-gray-400">Note</p>
                        <p className="font-medium text-gray-900 dark:text-white">{request.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      className="action-button"
                      onClick={() => handleDeny(request.id)}
                      disabled={updateAccessMutation.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Deny
                    </Button>
                    <Button
                      className="action-button"
                      onClick={() => handleApprove(request)}
                      disabled={updateAccessMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state for pending
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No pending requests</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You don't have any pending access requests from doctors
              </p>
            </div>
          )}
        </TabsContent>

        {/* Approved Requests */}
        <TabsContent value="approved" className="mt-6">
          {isLoading ? (
            // Loading state
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-5">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : approvedRequests.length > 0 ? (
            approvedRequests.map((request) => {
              const isExpired = new Date(request.expiryDate as string) < new Date();
              
              return (
                <Card key={request.id} className="mb-4">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {request.doctor?.fullName || `Doctor #${request.doctorId}`}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {request.doctor?.specialty || "Healthcare Provider"}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={isExpired ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}
                      >
                        {isExpired ? "Expired" : "Active"}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Approved On</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.requestDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Expires On</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.expiryDate as string)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                        <p className="font-medium text-gray-900 dark:text-white">{request.purpose}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Limited Scope</p>
                        <p className="font-medium text-gray-900 dark:text-white">{request.limitedScope ? "Yes" : "No"}</p>
                      </div>
                    </div>
                    
                    {!isExpired && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="destructive"
                          onClick={() => handleDeny(request.id)}
                          disabled={updateAccessMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Revoke Access
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Empty state for approved
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No approved requests</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You haven't approved any access requests yet
              </p>
            </div>
          )}
        </TabsContent>

        {/* Denied Requests */}
        <TabsContent value="denied" className="mt-6">
          {isLoading ? (
            // Loading state
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardContent className="p-5">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="ml-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : deniedRequests.length > 0 ? (
            deniedRequests.map((request) => (
              <Card key={request.id} className="mb-4">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.doctor?.fullName || `Doctor #${request.doctorId}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.doctor?.specialty || "Healthcare Provider"}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={getStatusBadgeColor(request.status)}
                    >
                      Denied
                    </Badge>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requested On</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.requestDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.purpose}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleApprove(request)}
                      disabled={updateAccessMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Reconsider & Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state for denied
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No denied requests</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You haven't denied any access requests
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        request={selectedRequest}
      />
    </MainLayout>
  );
}
