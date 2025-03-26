import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  AlertTriangle,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleBadgeColor, formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Define edit user form schema 
const editUserSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  role: z.string(),
});

// Define add user form schema
const addUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialty: z.string().optional(),
  phone: z.string().optional(),
  role: z.string(),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;
type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function AdminUserManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Setup form for editing user
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      specialty: "",
      phone: "",
      role: "",
    },
  });
  
  // Setup form for adding user
  const addForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      specialty: "",
      phone: "",
      role: UserRole.PATIENT,
    },
  });

  // Update form values when editing user changes
  React.useEffect(() => {
    if (editingUser) {
      editForm.reset({
        fullName: editingUser.fullName,
        email: editingUser.email,
        specialty: editingUser.specialty || "",
        phone: editingUser.phone || "",
        role: editingUser.role,
      });
    }
  }, [editingUser, editForm]);

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormValues & { id: number }) => {
      const { id, ...userData } = data;
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User details have been successfully updated"
      });
      
      // Close modal and reset form
      setIsEditDialogOpen(false);
      setEditingUser(null);
      
      // Refetch user data to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating a new user
  const createUserMutation = useMutation({
    mutationFn: async (data: AddUserFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "New user has been successfully created"
      });
      
      // Close modal and reset form
      setIsAddDialogOpen(false);
      addForm.reset();
      
      // Refetch user data to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
    const user = users?.find(u => u.id === userId);
    if (user) {
      setEditingUser(user);
      setIsEditDialogOpen(true);
    }
  };

  // Handler for saving user edits
  const handleSaveUserEdit = (values: EditUserFormValues) => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        ...values,
      });
    }
  };

  // Handler for adding a new user
  const handleAddUser = () => {
    setIsAddDialogOpen(true);
  };
  
  // Handler for saving new user
  const handleSaveNewUser = (values: AddUserFormValues) => {
    createUserMutation.mutate(values);
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
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveUserEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserRole.DOCTOR}>Doctor</SelectItem>
                        <SelectItem value={UserRole.PATIENT}>Patient</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editForm.watch("role") === UserRole.DOCTOR && (
                <FormField
                  control={editForm.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter specialty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="mr-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending || !editForm.formState.isDirty}
                >
                  {updateUserMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
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
