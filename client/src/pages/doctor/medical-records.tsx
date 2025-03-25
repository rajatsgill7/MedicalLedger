import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useRoute } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { RecordCard } from "@/components/medical/record-card";
import { SearchFilters } from "@/components/medical/search-filters";
import { UploadRecordModal } from "@/components/medical/upload-record-modal";
import { useToast } from "@/hooks/use-toast";
import { Record } from "@shared/schema";
import { 
  Upload,
  Folder,
  Loader2,
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function DoctorMedicalRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [match, params] = useRoute<{ patientId: string }>("/patients/:patientId/records");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<Record | null>(null);
  const [patientIdFilter, setPatientIdFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [recordType, setRecordType] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [patientName, setPatientName] = useState<string>("");
  const [isBackToPatients, setIsBackToPatients] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, navigate] = useRoute("*");
  
  // If we have a patient ID in the URL, use it to filter records
  useEffect(() => {
    if (params?.patientId) {
      setPatientIdFilter(params.patientId);
      
      // Fetch patient details to show name
      if (user?.id) {
        fetch(`/api/users/${params.patientId}`)
          .then(res => res.json())
          .then(data => {
            if (data.fullName) {
              setPatientName(data.fullName);
            }
          })
          .catch(err => {
            console.error("Error fetching patient details:", err);
          });
      }
      
      setIsBackToPatients(true);
    }
  }, [params?.patientId, user?.id]);

  // Fetch doctor's records
  const { data: records, isLoading } = useQuery<Record[]>({
    queryKey: [`/api/records/doctor/${user?.id}`],
    enabled: !!user?.id,
  });

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
      description: "The medical record is being downloaded."
    });
  };

  // Filter records based on search and filters
  const filteredRecords = records?.filter(record => {
    // Patient ID filter
    const matchesPatientId = !patientIdFilter || record.patientId.toString() === patientIdFilter;
    
    // Search term filter
    const matchesSearch = !searchTerm || 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Record type filter
    const matchesType = !recordType || record.recordType === recordType;
    
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
    
    return matchesPatientId && matchesSearch && matchesType && matchesDate;
  }) || [];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          {isBackToPatients && (
            <Button 
              variant="ghost" 
              className="mb-2"
              onClick={() => navigate("/doctor/patients")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {patientName ? `${patientName}'s Medical Records` : "Medical Records"}
          </h1>
        </div>
        <Button 
          className="mt-4 sm:mt-0"
          onClick={() => setUploadModalOpen(true)}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Record
        </Button>
      </div>

      {/* Patient ID filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Patient ID
            </label>
            <Input
              id="patientId"
              placeholder="Enter patient ID"
              value={patientIdFilter}
              onChange={(e) => setPatientIdFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <SearchFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        recordType={recordType}
        setRecordType={setRecordType}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDoctorFilter={false}
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
              <Folder className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No records found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {patientIdFilter || searchTerm || recordType || dateRange !== "all" 
                ? "Try adjusting your filters or search terms"
                : "Upload a medical record or request access to patient records"
              }
            </p>
            {!patientIdFilter && !searchTerm && !recordType && dateRange === "all" && (
              <Button
                className="mt-4"
                onClick={() => setUploadModalOpen(true)}
              >
                Upload a Record
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Upload Record Modal */}
      <UploadRecordModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        patientId={patientIdFilter ? parseInt(patientIdFilter) : undefined}
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
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patient ID</h4>
              <p>{viewRecord?.patientId}</p>
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
