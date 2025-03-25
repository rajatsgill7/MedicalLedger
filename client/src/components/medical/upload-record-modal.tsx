import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { recordTypes } from "@/lib/utils";
import { Upload, CloudUpload } from "lucide-react";

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
import { insertRecordSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Create the form schema based on the record schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  recordType: z.string().min(1, "Record type is required"),
  doctorName: z.string().min(1, "Doctor name is required"),
  recordDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  fileUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface UploadRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: number;
}

export function UploadRecordModal({ isOpen, onClose, patientId }: UploadRecordModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  // Set up form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      recordType: "",
      doctorName: "",
      recordDate: new Date().toISOString().split('T')[0],
      notes: "",
      fileUrl: "",
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // In a real app, you would upload the file to your server/storage here
      // and then set the fileUrl field with the returned URL
      form.setValue("fileUrl", URL.createObjectURL(file));
    }
  };

  // Submit mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const recordData = {
        patientId: patientId || user?.id,
        title: data.title,
        recordType: data.recordType,
        doctorName: data.doctorName,
        recordDate: new Date(data.recordDate),
        notes: data.notes,
        fileUrl: data.fileUrl || "placeholder-url", // In a real app, this would be the actual file URL
      };
      
      const res = await apiRequest("POST", "/api/records", recordData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Record uploaded",
        description: "Your medical record has been uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId || user?.id}/records`] });
      onClose();
      form.reset();
      setFileName(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    uploadMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Medical Record
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to upload a new medical record
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Annual Physical Examination" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recordType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select record type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recordTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Healthcare Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recordDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information about this record..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Upload File</FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <CloudUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {fileName || "PDF, JPG, PNG up to 10MB"}
                  </p>
                </div>
              </div>
            </FormItem>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
