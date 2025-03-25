import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { User, AccessRequest } from "@shared/schema";
import { 
  User as UserIcon,
  UserCheck,
  UserX,
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function PatientDoctors() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch access requests to determine which doctors have access
  const { data: accessRequests, isLoading: isLoadingAccess } = useQuery<(AccessRequest & {doctor?: User})[]>({
    queryKey: [`/api/access-requests/patient/${user?.id}`],
    enabled: !!user?.id
  });

  // Fetch all doctors
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery<User[]>({
    queryKey: ['/api/doctors'],
  });

  // Filter doctors who have approved access
  const doctorsWithAccess = accessRequests?.filter(
    req => req.status === "approved" && 
    (req.expiryDate ? new Date(req.expiryDate) > new Date() : true)
  ) || [];

  // Mutation for revoking access
  const revokeAccessMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiRequest("PATCH", `/api/access-requests/${requestId}`, {
        status: "revoked"
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate the queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/access-requests/patient/${user?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handler for revoking access
  const handleRevokeAccess = (requestId: number, doctorName: string) => {
    // Show a loading toast
    toast({
      title: "Revoking access...",
      description: `Revoking access for ${doctorName}`,
    });
    
    // Call the mutation to revoke access
    revokeAccessMutation.mutate(requestId, {
      onSuccess: () => {
        toast({
          title: "Access revoked",
          description: `You have revoked access for ${doctorName}`
        });
      }
    });
  };

  // Filter doctors based on search term
  const filteredDoctors = doctors?.filter(doctor => 
    doctor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Healthcare Providers</h1>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search doctors by name or specialty..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Doctors with Access Section */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Doctors with Access
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {isLoadingAccess ? (
          // Loading state
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
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
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : doctorsWithAccess.length > 0 ? (
          doctorsWithAccess.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-5">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {request.doctor?.fullName || `Doctor #${request.doctorId}`}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.doctor?.specialty || "Healthcare Provider"}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Active Access
                  </Badge>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Access Granted</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(request.requestDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Expires</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(request.expiryDate as string)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Purpose</p>
                    <p className="font-medium text-gray-900 dark:text-white">{request.purpose}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Limited Scope</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {request.limitedScope ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="destructive"
                    onClick={() => handleRevokeAccess(
                      request.id, 
                      request.doctor?.fullName || `Doctor #${request.doctorId}`
                    )}
                    disabled={revokeAccessMutation.isPending}
                  >
                    {revokeAccessMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <UserX className="mr-2 h-4 w-4" />
                        Revoke Access
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <UserCheck className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No doctors have access
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              When you approve access requests, doctors will appear here
            </p>
          </div>
        )}
      </div>

      {/* Available Doctors Section */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Available Healthcare Providers
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingDoctors ? (
          // Loading state
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="ml-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => {
            // Check if doctor already has access
            const hasAccess = doctorsWithAccess.some(
              req => req.doctorId === doctor.id
            );
            
            return (
              <Card key={doctor.id}>
                <CardContent className="p-5">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {doctor.fullName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {doctor.specialty || "Healthcare Provider"}
                      </p>
                    </div>
                  </div>
                  
                  {hasAccess ? (
                    <Badge 
                      className="mt-4 w-full justify-center py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      variant="outline"
                    >
                      Has Access
                    </Badge>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No active access requests
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No doctors found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your search
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
