import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { User, UserRole } from "@shared/schema";
import { 
  PersonStanding,
  Download,
  Search,
  Edit,
  PlusCircle,
  Users,
  UserCog,
  Folder,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleBadgeColor, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function AdminUserManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Paginate users
  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handler for editing a user
  const handleEditUser = (userId: number) => {
    // In a real app, this would open an edit modal
    toast({
      title: "Edit user",
      description: `Editing user with ID: ${userId}`
    });
  };

  // Handler for adding a new user
  const handleAddUser = () => {
    // In a real app, this would open a create user modal
    toast({
      title: "Add user",
      description: "Creating a new user"
    });
  };

  // Handler for exporting data
  const handleExportData = () => {
    // In a real app, this would trigger a data export
    toast({
      title: "Export data",
      description: "Exporting user data"
    });
  };

  // Calculate dashboard stats
  const totalUsers = users?.length || 0;
  const totalDoctors = users?.filter(user => user.role === UserRole.DOCTOR).length || 0;
  const totalPatients = users?.filter(user => user.role === UserRole.PATIENT).length || 0;
  const totalAdmins = users?.filter(user => user.role === UserRole.ADMIN).length || 0;

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button 
            onClick={handleAddUser}
            className="bg-secondary hover:bg-secondary-dark"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportData}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Stat Card 1 - Total Users */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</h3>
              <span className="p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalUsers}</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-2">
              <span className="material-icons text-sm mr-1">↑</span>
              Active accounts
            </p>
          </CardContent>
        </Card>
        
        {/* Stat Card 2 - Active Doctors */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Doctors</h3>
              <span className="p-2 rounded-full bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-200">
                <UserCog className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalDoctors}</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-2">
              <span className="material-icons text-sm mr-1">↑</span>
              Registered providers
            </p>
          </CardContent>
        </Card>
        
        {/* Stat Card 3 - Patients */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Patients</h3>
              <span className="p-2 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200">
                <PersonStanding className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalPatients}</p>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center mt-2">
              <span className="material-icons text-sm mr-1">↑</span>
              Registered patients
            </p>
          </CardContent>
        </Card>
        
        {/* Stat Card 4 - Admins */}
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Admins</h3>
              <span className="p-2 rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalAdmins}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center mt-2">
              <span className="material-icons text-sm mr-1">⚠</span>
              System admins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden mb-6">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Users</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search users..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined Date</TableHead>
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
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32 mt-1" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            <span className="text-sm font-medium">
                              {user.fullName.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                        {user.specialty && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.specialty}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.createdAt ? formatDate(user.createdAt) : "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditUser(user.id)}
                          className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No users found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Try a different search term
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
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

      {/* Security Alerts */}
      <div className="p-5 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="text-red-500 h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Security Alerts</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Multiple failed login attempts detected for several users</li>
                <li>Account lockouts may be required for security purposes</li>
                <li>Several doctors have access permissions expiring soon</li>
              </ul>
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Button variant="link" className="text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900">
                  View Security Log
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
