import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { accessPurposes, accessDurations } from "@/lib/utils";
import { Key, Search, User } from "lucide-react";
import { insertAccessRequestSchema, User as UserType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Create a schema for the form
const formSchema = z.object({
  patientId: z.coerce.number().positive("Please enter a valid patient ID"),
  purpose: z.string().min(1, "Purpose is required"),
  duration: z.coerce.number().positive("Duration is required"),
  notes: z.string().optional(),
  limitedScope: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestAccessModal({ isOpen, onClose }: RequestAccessModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Fetch all patients for the search
  const { data: patients, isLoading: isLoadingPatients } = useQuery<UserType[]>({
    queryKey: ['/api/patients'],
    enabled: isOpen && !!user?.id, // Only fetch when modal is open and user is logged in
  });

  // Set up form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: undefined,
      purpose: "",
      duration: 30,
      notes: "",
      limitedScope: false,
    },
  });

  // Filter patients based on search query
  const filteredPatients = patients?.filter(patient => 
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toString().includes(searchQuery)
  ) || [];

  // Submit mutation
  const requestMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const requestData = {
        doctorId: user?.id,
        patientId: data.patientId,
        purpose: data.purpose,
        duration: data.duration,
        notes: data.notes,
        limitedScope: data.limitedScope,
        status: "pending"
      };
      
      const res = await apiRequest("POST", "/api/access-requests", requestData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Access request sent",
        description: "Your request has been sent to the patient for approval",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/access-requests/doctor/${user?.id}`] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    requestMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" /> Request Patient Access
          </DialogTitle>
          <DialogDescription>
            Request permission to access a patient's medical records
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Find a Patient</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input 
                  placeholder="Search by name, email, or ID..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                  }}
                />
              </div>
              
              {/* Patient search results */}
              {isSearching && (
                <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                  {isLoadingPatients ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading patients...</p>
                    </div>
                  ) : filteredPatients.length > 0 ? (
                    <div className="divide-y">
                      {filteredPatients.map((patient) => (
                        <div 
                          key={patient.id} 
                          className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
                          onClick={() => {
                            form.setValue('patientId', patient.id);
                            setSearchQuery(patient.fullName);
                            setIsSearching(false);
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium">{patient.fullName}</p>
                              <p className="text-xs text-gray-500">{patient.email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                            ID: {patient.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No patients found matching your search
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter patient ID" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Access</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accessPurposes.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Duration</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accessDurations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value.toString()}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note to Patient (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain why you need access to this patient's records..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limitedScope"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Limit access to records related to my specialty
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This will only request access to records that match your medical specialty
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={requestMutation.isPending}>
                {requestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
