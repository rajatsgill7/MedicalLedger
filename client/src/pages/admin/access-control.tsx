import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { AccessRequest } from "@shared/schema";
import { 
  Key,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Shield,
  ShieldQuestion,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getStatusBadgeColor } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Extended type for access requests with doctor and patient info
type ExtendedAccessRequest = AccessRequest & {
  doctor?: {
    id: number;
    fullName: string;
    specialty?: string;
    email: string;
  };
  patient?: {
    id: number;
    fullName: string;
    email: string;
  };
};

export default function AdminAccessControl() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all access requests
  const { data: accessRequests, isLoading } = useQuery<ExtendedAccessRequest[]>({
    queryKey: ['/api/access-requests'],
  });

  // Calculate stats
  const pendingCount = accessRequests?.filter(req => req.status === "pending").length || 0;
  const approvedCount = accessRequests?.filter(req => req.status === "approved").length || 0;
  const deniedCount = accessRequests?.filter(req => req.status === "denied").length || 0;
  const expiredCount = accessRequests?.filter(req => 
    req.status === "approved" && req.expiryDate && new Date(req.expiryDate) < new Date()
  ).length || 0;

  // Handle access override (for emergency situations)
  const handleOverrideAccess = (requestId: number) => {
    toast({
      title: "Access override initiated",
      description: "Emergency access override has been logged and will be reviewed"
    });
  };

  // Handle updating request status
  const handleUpdateStatus = (requestId: number, status: string) => {
    toast({
      title: `Request ${status}`,
      description: `Access request has been ${status}`
    });
  };

  // Filter requests based on search and status
  const filteredRequests = accessRequests?.filter(request => {
    // Search filter
    const matchesSearch = !searchTerm || 
      (request.doctor?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      request.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    let matchesStatus = statusFilter === "all";
    if (statusFilter === "pending") {
      matchesStatus = request.status === "pending";
    } else if (statusFilter === "approved") {
      matchesStatus = request.status === "approved" && 
        (!request.expiryDate || new Date(request.expiryDate) >= new Date());
    } else if (statusFilter === "denied") {
      matchesStatus = request.status === "denied";
    } else if (statusFilter === "expired") {
      matchesStatus = request.status === "approved" && 
        request.expiryDate && new Date(request.expiryDate) < new Date();
    }
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Sort requests by date (newest first)
  const sortedRequests = [...filteredRequests].sort((a, b) => 
    new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
  );

  // Paginate requests
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const paginatedRequests = sortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Check if a request is expired
  const isExpired = (request: ExtendedAccessRequest) => {
    return request.status === "approved" && 
      request.expiryDate && new Date(request.expiryDate) < new Date();
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Control</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Requests</h3>
              <span className="p-2 rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200">
                <ShieldQuestion className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{pendingCount}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center mt-2">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting decision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Access</h3>
              <span className="p-2 rounded-full bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-200">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{approvedCount - expiredCount}</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-2">
              <CheckCircle className="h-3 w-3 mr-1" />
              Currently approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Denied Requests</h3>
              <span className="p-2 rounded-full bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-200">
                <XCircle className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{deniedCount}</p>
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-2">
              <Shield className="h-3 w-3 mr-1" />
              Access denied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Expired Access</h3>
              <span className="p-2 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{expiredCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              Requires renewal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search by doctor, patient, or purpose..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved (Active)</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="overflow-hidden mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Purpose</TableHead>
                <TableHead className="hidden lg:table-cell">Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24 ml-2" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedRequests.length > 0 ? (
                paginatedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {request.doctor?.fullName.split(" ").map(n => n[0]).join("") || "D"}
                          </span>
                        </div>
                        <div className="ml-2">
                          <div className="font-medium">{request.doctor?.fullName || `Doctor #${request.doctorId}`}</div>
                          <div className="text-xs text-gray-500">{request.doctor?.specialty || "Healthcare Provider"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {request.patient?.fullName.split(" ").map(n => n[0]).join("") || "P"}
                          </span>
                        </div>
                        <div className="ml-2">
                          <div className="font-medium">{request.patient?.fullName || `Patient #${request.patientId}`}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={getStatusBadgeColor(isExpired(request) ? "expired" : request.status)}
                      >
                        {isExpired(request) ? "Expired" : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {request.requestDate ? formatDate(request.requestDate) : "Unknown date"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{request.purpose}</span>
                      {request.limitedScope && (
                        <div className="text-xs text-gray-500 mt-1">Limited scope: specialty only</div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm">{request.duration} days</span>
                      {request.expiryDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {formatDate(request.expiryDate as string)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {request.status === "pending" && (
                          <>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleUpdateStatus(request.id, "denied")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleUpdateStatus(request.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {request.status === "denied" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, "approved")}
                          >
                            Override
                          </Button>
                        )}
                        {request.status === "approved" && (
                          <Button 
                            variant={isExpired(request) ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, isExpired(request) ? "approved" : "denied")}
                          >
                            {isExpired(request) ? "Renew" : "Revoke"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <Key className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No access requests found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your filters" 
                          : "No access requests in the system yet"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    // Show first, last, and pages around current page
                    if (
                      i === 0 || 
                      i === totalPages - 1 || 
                      (i >= currentPage - 2 && i <= currentPage + 2)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                            isActive={currentPage === i + 1}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Show ellipsis
                    if (i === 1 && currentPage > 3) {
                      return (
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    if (i === totalPages - 2 && currentPage < totalPages - 3) {
                      return (
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Override Section */}
      <Card className="border-red-300 dark:border-red-800 border mb-6">
        <CardContent className="p-5">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ShieldAlert className="h-6 w-6 text-red-500 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Emergency Access Protocol</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                In emergency situations, administrators can temporarily override access controls to ensure timely medical care. 
                All emergency overrides are logged and require full justification.
              </p>
              <div className="mt-4">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    toast({
                      title: "Emergency Override",
                      description: "This action requires additional authorization. Please contact the on-call security officer."
                    });
                  }}
                >
                  Emergency Override
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HIPAA Compliance Notice */}
      <div className="p-5 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <ShieldCheck className="text-blue-500 h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">HIPAA Compliance Notice</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>All access control actions are subject to HIPAA compliance regulations. Administrators must ensure that access is granted only when necessary for patient care and with appropriate authorization.</p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Button 
                  variant="link" 
                  className="text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900"
                >
                  View Compliance Guidelines
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
