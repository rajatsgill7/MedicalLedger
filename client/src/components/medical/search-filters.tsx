import { 
  Search, 
  FilterX 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { recordTypes } from "@/lib/utils";

interface SearchFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  recordType: string;
  setRecordType: (value: string) => void;
  doctorFilter?: string;
  setDoctorFilter?: (value: string) => void;
  dateRange: string;
  setDateRange: (value: string) => void;
  doctorNames?: string[];
  showDoctorFilter?: boolean;
  patientNameSearch?: string;
  setPatientNameSearch?: (value: string) => void;
  showPatientSearch?: boolean;
}

export function SearchFilters({
  searchTerm,
  setSearchTerm,
  recordType,
  setRecordType,
  doctorFilter,
  setDoctorFilter,
  dateRange,
  setDateRange,
  doctorNames = [],
  showDoctorFilter = false,
  patientNameSearch = "",
  setPatientNameSearch,
  showPatientSearch = false
}: SearchFiltersProps) {
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setRecordType("all-types");
    if (setDoctorFilter) setDoctorFilter("all-doctors");
    if (setPatientNameSearch) setPatientNameSearch("");
    setDateRange("all");
  };

  // Check if any filters are applied
  const hasFilters = searchTerm || 
                    (recordType && recordType !== "all-types") || 
                    (doctorFilter && doctorFilter !== "all-doctors") || 
                    (patientNameSearch && patientNameSearch !== "") ||
                    dateRange !== "all";

  return (
    <Card className="bg-white dark:bg-gray-800 shadow">
      <CardContent className="bg-card text-card-foreground p-3 sm:p-4 md:p-6 rounded-lg border border-border/40 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <Input 
                type="text" 
                placeholder="Search records..." 
                className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {showPatientSearch && setPatientNameSearch && (
              <div className="relative mt-2">
                <Search className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <Input 
                  type="text" 
                  placeholder="Search by patient name..." 
                  className="pl-9 sm:pl-10 h-9 sm:h-10 text-sm"
                  value={patientNameSearch}
                  onChange={(e) => setPatientNameSearch(e.target.value)}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={recordType}
              onValueChange={setRecordType}
            >
              <SelectTrigger className="w-full md:w-[160px] h-9 sm:h-10 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                {recordTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showDoctorFilter && setDoctorFilter && (
              <Select
                value={doctorFilter}
                onValueChange={setDoctorFilter}
              >
                <SelectTrigger className="w-full md:w-[160px] h-9 sm:h-10 text-sm">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-doctors">All Doctors</SelectItem>
                  {doctorNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <SelectTrigger className="w-full md:w-[160px] h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetFilters}
                title="Clear filters"
                className="h-9 sm:h-10 w-9 sm:w-10 p-0"
              >
                <FilterX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}