import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { AuditLog } from "@shared/schema";
import { 
  ClipboardList,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  Clock,
  User,
  FileText,
  ChevronRight,
  X,
  Globe,
  Calendar,
  Hash,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getRoleBadgeColor } from "@/lib/utils";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Define action types for filtering
const actionTypes = [
  { value: "all", label: "All Actions" },
  { value: "user_login", label: "User Login" },
  { value: "user_logout", label: "User Logout" },
  { value: "user_registered", label: "User Registration" },
  { value: "record_created", label: "Record Created" },
  { value: "record_accessed", label: "Record Accessed" },
  { value: "access_requested", label: "Access Requested" },
  { value: "access_approved", label: "Access Approved" },
  { value: "access_denied", label: "Access Denied" },
  { value: "access_revoked", label: "Access Revoked" },
];

// Get badge color based on action type
function getActionBadgeColor(action: string) {
  switch (action) {
    case "user_login":
    case "user_logout":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "user_registered":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "record_created":
    case "record_accessed":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "access_requested":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "access_approved":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
    case "access_denied":
    case "access_revoked":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

// Format action label for display
function formatActionLabel(action: string) {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type LogWithUser = AuditLog & {
  user?: {
    id: number;
    username: string;
    fullName: string;
    email?: string;
    role: string;
  };
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
};

export default function AdminSystemLogs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogWithUser | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const itemsPerPage = 15;

  // Fetch all audit logs
  const { data: logs, isLoading } = useQuery<LogWithUser[]>({
    queryKey: ['/api/audit-logs'],
  });

  // Handler for exporting logs
  const handleExportLogs = () => {
    toast({
      title: "Exporting logs",
      description: "System logs export started"
    });
  };

  // Filter logs based on search and filters
  const filteredLogs = logs?.filter(log => {
    // Search filter
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Action type filter
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    // Time range filter
    let matchesTime = true;
    if (timeRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      matchesTime = logDate ? logDate >= today : false;
    } else if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      matchesTime = logDate ? logDate >= weekAgo : false;
    } else if (timeRange === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const logDate = log.timestamp ? new Date(log.timestamp) : null;
      matchesTime = logDate ? logDate >= monthAgo : false;
    }
    
    return matchesSearch && matchesAction && matchesTime;
  }) || [];

  // Sort logs by timestamp (newest first)
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  // Paginate logs
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get the right icon for an action
  const getActionIcon = (action: string) => {
    switch (action) {
      case "user_login":
      case "user_logout":
      case "user_registered":
        return <User className="h-4 w-4" />;
      case "record_created":
      case "record_accessed":
        return <FileText className="h-4 w-4" />;
      case "access_requested":
      case "access_approved":
      case "access_denied":
      case "access_revoked":
        return <Eye className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Format timestamp to show time with AM/PM
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
        <Button 
          variant="outline"
          className="mt-4 sm:mt-0"
          onClick={handleExportLogs}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Log Events</h3>
              <span className="p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                <ClipboardList className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {logs?.length || 0}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-2">
              System-wide activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Access Events</h3>
              <span className="p-2 rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200">
                <Eye className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {logs?.filter(log => 
                log.action.includes('access_') || 
                log.action === 'record_accessed'
              ).length || 0}
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center mt-2">
              Record access events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Security Events</h3>
              <span className="p-2 rounded-full bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-200">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {logs?.filter(log => 
                log.action === 'access_denied' || 
                log.action === 'access_revoked'
              ).length || 0}
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center mt-2">
              Access denials & revocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Logs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search by user, action, or details..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Action Type
              </label>
              <Select 
                value={actionFilter} 
                onValueChange={setActionFilter}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(action => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Range
              </label>
              <Select 
                value={timeRange} 
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden mb-6">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="hidden lg:table-cell">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-full" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((log, index) => (
                  <TableRow 
                    key={index}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.timestamp ? formatDate(new Date(log.timestamp)) : 'Unknown date'}</div>
                        <div className="text-xs text-gray-500">{log.timestamp ? formatTime(log.timestamp) : 'Unknown time'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {log.user.fullName.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <div className="ml-2">
                            <div className="font-medium">{log.user.fullName}</div>
                            <div className="text-xs text-gray-500">{log.user.role}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unknown User (ID: {log.userId})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={`flex items-center ${getActionBadgeColor(log.action)}`}
                      >
                        {getActionIcon(log.action)}
                        <span className="ml-1">{formatActionLabel(log.action)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{log.details}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm font-mono">{log.ipAddress}</span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <ClipboardList className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">No logs found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try adjusting your filters
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

      {/* Security Alert */}
      <div className="p-5 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="text-yellow-400 h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Retention Policy
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>System logs are retained for 90 days in compliance with regulatory requirements. Logs older than 90 days are automatically archived and can be requested by administrators for compliance audits.</p>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Button 
                  variant="link" 
                  className="text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                >
                  Request Archived Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center mr-2">
                {getActionIcon(selectedLog?.action || 'unknown')}
              </div>
              <span>Log Details: {formatActionLabel(selectedLog?.action || 'unknown')}</span>
            </DialogTitle>
            <DialogDescription>
              Timestamp: {selectedLog?.timestamp ? formatDate(new Date(selectedLog.timestamp)) + ' at ' + formatTime(selectedLog.timestamp) : 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  User Information
                </h3>
                {selectedLog?.user ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {selectedLog.user.fullName.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">{selectedLog.user.fullName}</div>
                        <div className="text-sm text-gray-500">@{selectedLog.user.username}</div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500">User ID:</span>
                        <span className="col-span-2 font-mono">{selectedLog.user.id}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm mt-1">
                        <span className="text-gray-500">Role:</span>
                        <span className="col-span-2">
                          <Badge variant="outline" className={`${getRoleBadgeColor(selectedLog.user.role)}`}>
                            {selectedLog.user.role}
                          </Badge>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-sm mt-1">
                        <span className="text-gray-500">Email:</span>
                        <span className="col-span-2">{selectedLog.user.email}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    User information not available (User ID: {selectedLog?.userId || 'Unknown'})
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Connection Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">IP Address:</span>
                    <span className="col-span-2 font-mono">{selectedLog?.ipAddress || 'Unknown'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">User Agent:</span>
                    <span className="col-span-2 text-xs">{selectedLog?.userAgent || 'Unknown'}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Session ID:</span>
                    <span className="col-span-2 font-mono text-xs">{selectedLog?.sessionId || 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Event Details
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 lg:grid-cols-4 text-sm">
                    <span className="text-gray-500 lg:col-span-1">Action:</span>
                    <span className="lg:col-span-3">
                      <Badge 
                        variant="outline"
                        className={`flex items-center inline-flex ${getActionBadgeColor(selectedLog?.action || '')}`}
                      >
                        {getActionIcon(selectedLog?.action || '')}
                        <span className="ml-1">{formatActionLabel(selectedLog?.action || '')}</span>
                      </Badge>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 text-sm mt-2">
                    <span className="text-gray-500 lg:col-span-1">Timestamp:</span>
                    <span className="lg:col-span-3">{selectedLog?.timestamp ? formatDate(new Date(selectedLog.timestamp)) + ' at ' + formatTime(selectedLog.timestamp) : 'Unknown'}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-4 text-sm mt-2">
                    <span className="text-gray-500 lg:col-span-1">Details:</span>
                    <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1 whitespace-pre-wrap">
                      {selectedLog?.details || 'No additional details available'}
                    </div>
                  </div>
                  
                  {selectedLog?.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 text-sm mt-3">
                      <span className="text-gray-500 lg:col-span-1">Metadata:</span>
                      <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1 font-mono text-xs overflow-x-auto">
                        <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailDialogOpen(false)}
              className="mr-2"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
