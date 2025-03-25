import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { RequestAccessModal } from "@/components/medical/request-access-modal";
import { useToast } from "@/hooks/use-toast";
import { 
  Link as LinkIcon, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessRequest } from "@shared/schema";
import { formatDate, getStatusBadgeColor } from "@/lib/utils";

export default function DoctorRequestAccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch access requests for the doctor
  const { data: requests, isLoading } = useQuery<(AccessRequest & {patient?: any})[]>({
    queryKey: [`/api/access-requests/doctor/${user?.id}`],
    enabled: !!user?.id,
  });

  // Handle checking status (in a real app would refetch)
  const handleCheckStatus = (requestId: number) => {
    toast({
      title: "Checking status",
      description: "Refreshing access request status"
    });
  };

  // Sort requests by status and date
  const pendingRequests = requests?.filter(req => req.status === "pending")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()) || [];
  
  const approvedRequests = requests?.filter(req => req.status === "approved")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()) || [];
  
  const deniedRequests = requests?.filter(req => req.status === "denied")
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()) || [];

  // Filter requests by search term
  const filterRequests = (reqs: (AccessRequest & {patient?: any})[]) => {
    if (!searchTerm) return reqs;
    
    return reqs.filter(req => 
      req.patient?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.purpose.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPending = filterRequests(pendingRequests);
  const filteredApproved = filterRequests(approvedRequests);
  const filteredDenied = filterRequests(deniedRequests);

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request Patient Access</h1>
        <Button 
          className="mt-4 sm:mt-0"
          onClick={() => setRequestModalOpen(true)}
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          New Access Request
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input 
            placeholder="Search patient name or request purpose..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                  <div className="mt-4 flex justify-end">
                    <Skeleton className="h-10 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredPending.length > 0 ? (
            filteredPending.map((request) => (
              <Card key={request.id} className="mb-4">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        <LinkIcon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.patient?.fullName || `Patient #${request.patientId}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Patient ID: {request.patientId}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={getStatusBadgeColor(request.status)}
                    >
                      Pending Approval
                    </Badge>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Request Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.requestDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-medium text-gray-900 dark:text-white">Awaiting</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.purpose}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Requested Duration</p>
                      <p className="font-medium text-gray-900 dark:text-white">{request.duration} days</p>
                    </div>
                    {request.notes && (
                      <div className="md:col-span-2">
                        <p className="text-gray-500 dark:text-gray-400">Note</p>
                        <p className="font-medium text-gray-900 dark:text-white">{request.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleCheckStatus(request.id)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No pending requests</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? "No pending requests match your search" : "You don't have any pending access requests"}
              </p>
              {!searchTerm && (
                <Button
                  className="mt-4"
                  onClick={() => setRequestModalOpen(true)}
                >
                  Create New Request
                </Button>
              )}
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
          ) : filteredApproved.length > 0 ? (
            filteredApproved.map((request) => {
              const isExpired = new Date(request.expiryDate as string) < new Date();
              
              return (
                <Card key={request.id} className="mb-4">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {request.patient?.fullName || `Patient #${request.patientId}`}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Patient ID: {request.patientId}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={isExpired ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"}
                      >
                        {isExpired ? "Expired" : "Active Access"}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Approved On</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.requestDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Access Until</p>
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
                    
                    {isExpired && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() => setRequestModalOpen(true)}
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Request New Access
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            // Empty state
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No approved requests</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? "No approved requests match your search" : "None of your access requests have been approved yet"}
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
          ) : filteredDenied.length > 0 ? (
            filteredDenied.map((request) => (
              <Card key={request.id} className="mb-4">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-300">
                        <XCircle className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {request.patient?.fullName || `Patient #${request.patientId}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Patient ID: {request.patientId}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className={getStatusBadgeColor(request.status)}
                    >
                      Access Denied
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
                      onClick={() => setRequestModalOpen(true)}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Request Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Empty state
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No denied requests</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? "No denied requests match your search" : "None of your access requests have been denied"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Access Modal */}
      <RequestAccessModal 
        isOpen={requestModalOpen} 
        onClose={() => setRequestModalOpen(false)} 
      />
    </MainLayout>
  );
}
