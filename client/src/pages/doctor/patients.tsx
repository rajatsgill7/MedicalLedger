import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { PatientCard } from "@/components/medical/patient-card";
import { RequestAccessModal } from "@/components/medical/request-access-modal";
import { useToast } from "@/hooks/use-toast";
import { 
  User,
  Link as LinkIcon,
  Search,
  Loader2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AccessRequest } from "@shared/schema";
import { formatDate } from "@/lib/utils";

type Patient = {
  id: number;
  fullName: string;
  accessStatus: string;
  recordCount: number;
  lastVisit?: string;
  accessUntil?: string;
};

export default function DoctorPatients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("lastVisit");

  // Fetch access requests to determine patient access
  const { data: accessRequests, isLoading: isLoadingAccess, refetch } = useQuery<(AccessRequest & {patient?: any})[]>({
    queryKey: [`/api/access-requests/doctor/${user?.id}`],
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
    staleTime: 2000 // Consider data stale after 2 seconds
  });

  // Group patients by access status
  const getPatientsWithAccess = () => {
    if (!accessRequests) return [];
    
    const now = new Date();
    const patientsMap = new Map<number, Patient>();
    
    // Process all access requests to determine status
    accessRequests.forEach(request => {
      if (!request.patient) return;
      
      const patient = request.patient;
      const existingPatient = patientsMap.get(patient.id);
      
      // Skip if we already found this patient with active access
      if (existingPatient && existingPatient.accessStatus === "active") return;
      
      let accessStatus = "none";
      if (request.status === "approved") {
        const expiryDate = new Date(request.expiryDate as string);
        if (expiryDate > now) {
          accessStatus = "active";
        } else {
          accessStatus = "expired";
        }
      } else if (request.status === "pending") {
        accessStatus = "pending";
      } else if (request.status === "revoked") {
        // Don't show revoked requests at all - remove from display
        // If there's an existing status for this patient, keep it instead
        if (existingPatient) return;
        accessStatus = "none";
        return; // Skip adding this patient if access was revoked
      }
      
      // Only update if the new status is "better" than existing
      if (!existingPatient || 
          (accessStatus === "active" || 
           (accessStatus === "pending" && existingPatient.accessStatus === "expired") ||
           (accessStatus === "expired" && existingPatient.accessStatus === "none"))) {
        patientsMap.set(patient.id, {
          id: patient.id,
          fullName: patient.fullName,
          accessStatus,
          recordCount: patient.recordCount || 0, // Use the actual record count from the API
          lastVisit: request.requestDate,
          accessUntil: request.expiryDate as string,
        });
      }
    });
    
    return Array.from(patientsMap.values());
  };

  const patients = getPatientsWithAccess();

  // Filter and sort patients
  const filteredPatients = patients.filter(patient => {
    // Search filter
    const matchesSearch = !searchTerm || 
      patient.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && patient.accessStatus === "active") ||
      (statusFilter === "pending" && patient.accessStatus === "pending") ||
      (statusFilter === "expired" && patient.accessStatus === "expired");
    
    return matchesSearch && matchesStatus;
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortOrder === "name-asc") {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortOrder === "name-desc") {
      return b.fullName.localeCompare(a.fullName);
    } else if (sortOrder === "lastVisit") {
      return (b.lastVisit ? new Date(b.lastVisit).getTime() : 0) - 
             (a.lastVisit ? new Date(a.lastVisit).getTime() : 0);
    } else if (sortOrder === "recordCount") {
      return b.recordCount - a.recordCount;
    }
    return 0;
  });

  // Navigate to patient records
  const navigate = useLocation()[1];
  
  const handleViewRecords = (patientId: number) => {
    // Navigate to patient records page
    navigate(`/patients/${patientId}/records`);
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Patients</h1>
        <div className="flex mt-4 sm:mt-0 space-x-2">
          <Button 
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoadingAccess}
          >
            {isLoadingAccess ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
            )}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button 
            onClick={() => setRequestModalOpen(true)}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Request Patient Access
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input 
                placeholder="Search patients..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Access Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access Status</SelectItem>
                <SelectItem value="active">Active Access</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="expired">Expired Access</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={sortOrder} 
              onValueChange={setSortOrder}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastVisit">Last Visit</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="recordCount">Record Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoadingAccess ? (
          // Loading state
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-5">
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
                
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          ))
        ) : sortedPatients.length > 0 ? (
          sortedPatients.map((patient) => (
            <div key={patient.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {patient.fullName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: P-{patient.id.toString().padStart(5, '0')}
                      </p>
                    </div>
                  </div>
                  {patient.accessStatus === "active" && (
                    <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded border border-green-200 dark:border-green-800">
                      Active Access
                    </div>
                  )}
                  {patient.accessStatus === "pending" && (
                    <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800">
                      Pending Approval
                    </div>
                  )}
                  {patient.accessStatus === "expired" && (
                    <div className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium px-2.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                      Expired
                    </div>
                  )}
                  {patient.accessStatus === "none" && (
                    <div className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      No Access
                    </div>
                  )}
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  {patient.accessStatus === "active" && patient.accessUntil && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Access Until</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(patient.accessUntil)}
                      </p>
                    </div>
                  )}
                  {patient.lastVisit && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Last Activity</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(patient.lastVisit)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Records</p>
                    <p className="font-medium text-gray-900 dark:text-white">{patient.recordCount}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  {patient.accessStatus === "active" ? (
                    <Button 
                      variant="outline"
                      onClick={() => handleViewRecords(patient.id)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Records
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={() => setRequestModalOpen(true)}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Request Access
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No patients found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your filters"
                : "Request access to patients to see them here"
              }
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                className="mt-4"
                onClick={() => setRequestModalOpen(true)}
              >
                Request Patient Access
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Access Request Information */}
      <div className="mt-8 p-5 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Access Request Guidelines</h2>
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p>When requesting access to patient records, please note:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Access is granted for a maximum of 6 months at a time.</li>
            <li>You must specify the purpose for access (diagnosis, treatment, follow-up).</li>
            <li>Patients will receive immediate notification of your request.</li>
            <li>Access can be revoked by the patient at any time.</li>
            <li>All record views are logged and audited for compliance.</li>
          </ul>
          <p>For emergency access requests, please contact hospital administration directly.</p>
        </div>
      </div>

      {/* Request Access Modal */}
      <RequestAccessModal 
        isOpen={requestModalOpen} 
        onClose={() => setRequestModalOpen(false)} 
      />
    </MainLayout>
  );
}
