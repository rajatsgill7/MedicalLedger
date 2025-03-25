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
  showDoctorFilter = false
}: SearchFiltersProps) {
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setRecordType("all-types");
    if (setDoctorFilter) setDoctorFilter("all-doctors");
    setDateRange("all");
  };

  // Check if any filters are applied
  const hasFilters = searchTerm || recordType || doctorFilter || dateRange !== "all";

  return (
    <Card className="bg-white dark:bg-gray-800 shadow">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 h-4 w-4" />
              <Input 
                type="text" 
                placeholder="Search records..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={recordType}
              onValueChange={setRecordType}
            >
              <SelectTrigger className="w-full md:w-[180px]">
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
                <SelectTrigger className="w-full md:w-[180px]">
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
              <SelectTrigger className="w-full md:w-[180px]">
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
                size="icon"
                onClick={resetFilters}
                title="Clear filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
