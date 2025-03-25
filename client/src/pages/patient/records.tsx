import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { RecordCard } from "@/components/medical/record-card";
import { UploadRecordModal } from "@/components/medical/upload-record-modal";
import { SearchFilters } from "@/components/medical/search-filters";
import { useToast } from "@/hooks/use-toast";
import { Record, AccessRequest } from "@shared/schema";
import { 
  Bell, 
  Upload,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function PatientRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<Record | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordType, setRecordType] = useState<string>("all-types");
  const [doctorFilter, setDoctorFilter] = useState<string>("all-doctors");
  const [dateRange, setDateRange] = useState<string>("all");

  // Fetch patient records
  const { data: records, isLoading } = useQuery<Record[]>({
    queryKey: [`/api/patients/${user?.id}/records`],
    enabled: !!user?.id,
  });
  
  // Fetch access requests to check for pending ones
  const { data: accessRequests, isLoading: isLoadingAccessRequests } = useQuery<AccessRequest[]>({
    queryKey: [`/api/access-requests/patient/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Filter for pending requests only
  const pendingRequests = accessRequests?.filter(req => req.status === "pending") || [];

  // Handler for viewing a record
  const handleViewRecord = (id: number) => {
    const record = records?.find(r => r.id === id);
    if (record) {
      setViewRecord(record);
    }
  };

  // Handler for downloading a record
  const handleDownloadRecord = (id: number) => {
    // In a real app, this would trigger a file download
    toast({
      title: "Download started",
      description: "Your medical record is being downloaded."
    });
  };

  // Filter records based on search and filters
  const filteredRecords = records?.filter(record => {
    // Search term filter
    const matchesSearch = !searchTerm || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Record type filter
    const matchesType = !recordType || recordType === "all-types" || record.recordType === recordType;
    
    // Doctor filter
    const matchesDoctor = !doctorFilter || doctorFilter === "all-doctors" || record.doctorName === doctorFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateRange === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = new Date(record.recordDate) >= thirtyDaysAgo;
    } else if (dateRange === "6months") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      matchesDate = new Date(record.recordDate) >= sixMonthsAgo;
    } else if (dateRange === "12months") {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      matchesDate = new Date(record.recordDate) >= twelveMonthsAgo;
    }
    
    return matchesSearch && matchesType && matchesDoctor && matchesDate;
  }) || [];

  // Get unique doctor names for filter dropdown
  const doctorNames = records ? [...new Set(records.map(record => record.doctorName))]
    .filter(Boolean)
    .sort() : [];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Medical Records</h1>
        <Button 
          className="mt-4 sm:mt-0"
          onClick={() => setUploadModalOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Record
        </Button>
      </div>

      {/* Search and filters */}
      <SearchFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        recordType={recordType}
        setRecordType={setRecordType}
        doctorFilter={doctorFilter}
        setDoctorFilter={setDoctorFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        doctorNames={doctorNames}
        showDoctorFilter={true}
      />

      {/* Records List */}
      <div className="space-y-4 mt-6">
        {isLoading ? (
          // Loading state
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="flex justify-between">
                <div className="space-y-2 w-3/4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-6 w-20 ml-auto" />
                  <div className="flex justify-end mt-2 space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : filteredRecords.length > 0 ? (
          // Records list
          filteredRecords.map((record) => (
            <RecordCard
              key={record.id}
              id={record.id}
              title={record.title}
              recordType={record.recordType}
              doctorName={record.doctorName || "Unknown Provider"}
              recordDate={record.recordDate.toString()}
              notes={record.notes || undefined}
              verified={record.verified}
              onView={handleViewRecord}
              onDownload={handleDownloadRecord}
            />
          ))
        ) : (
          // Empty state
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No records found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || recordType !== "all-types" || doctorFilter !== "all-doctors" || dateRange !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Get started by uploading your first medical record"
              }
            </p>
            {!searchTerm && recordType === "all-types" && doctorFilter === "all-doctors" && dateRange === "all" && (
              <Button
                className="mt-4"
                onClick={() => setUploadModalOpen(true)}
              >
                Upload Your First Record
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Access Requests Alert */}
      {pendingRequests.length > 0 && !isLoading && !isLoadingAccessRequests && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="text-yellow-400 h-5 w-5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                You have {pendingRequests.length} pending access {pendingRequests.length === 1 ? 'request' : 'requests'}
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Healthcare providers have requested access to your medical records.</p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link href="/patient/access-requests">
                    <Button
                      variant="link"
                      className="px-2 py-1.5 text-sm text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                    >
                      Review Requests
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Record Modal */}
      <UploadRecordModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
      />

      {/* View Record Detail Modal */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{viewRecord?.title}</DialogTitle>
            <DialogDescription>
              {viewRecord?.doctorName} • {viewRecord?.recordDate.toString().split('T')[0]}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</h4>
              <p>{viewRecord?.recordType}</p>
            </div>
            
            {viewRecord?.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h4>
                <p>{viewRecord.notes}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h4>
              <p>{viewRecord?.verified ? "Verified" : "Pending Verification"}</p>
            </div>
            
            {viewRecord?.fileUrl && (
              <div className="border rounded-md p-4 flex justify-center items-center">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">File Preview</p>
                  <Button
                    onClick={() => handleDownloadRecord(viewRecord.id)}
                  >
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
