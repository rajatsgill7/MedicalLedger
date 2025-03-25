import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Shield, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Doctor {
  id: number;
  fullName: string;
  specialty?: string;
  email: string;
}

interface AccessRequest {
  id: number;
  doctorId: number;
  patientId: number;
  purpose: string;
  duration: number;
  notes?: string;
  status: string;
  requestDate: string;
  doctor?: Doctor;
}

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AccessRequest | null;
}

export function ApprovalModal({ isOpen, onClose, request }: ApprovalModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [limitScope, setLimitScope] = useState(false);
  
  // Handle approval/denial mutations
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/access-requests/${id}`, {
        status,
        limitedScope: status === "approved" ? limitScope : false
      });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      const action = variables.status === "approved" ? "approved" : "denied";
      toast({
        title: `Access request ${action}`,
        description: `You have ${action} the doctor's access request`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/access-requests/patient/${user?.id}`] });
      onClose();
      setLimitScope(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (request) {
      updateRequestMutation.mutate({ id: request.id, status: "approved" });
    }
  };

  const handleDeny = () => {
    if (request) {
      updateRequestMutation.mutate({ id: request.id, status: "denied" });
    }
  };

  // No-op if no request
  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Approve Access Request
          </DialogTitle>
          <DialogDescription>
            The following healthcare provider has requested access to your medical records:
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
              <UserCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h4 className="text-base font-medium">
                {request.doctor?.fullName || `Doctor #${request.doctorId}`}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {request.doctor?.specialty || "Healthcare Provider"}
              </p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Purpose</p>
              <p className="font-medium">{request.purpose}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Duration</p>
              <p className="font-medium">{request.duration} Days</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Requested On</p>
              <p className="font-medium">{formatDate(request.requestDate)}</p>
            </div>
            {request.notes && (
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Note</p>
                <p className="font-medium">{request.notes}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            By approving this request, you are granting this healthcare provider access to view your medical records for the specified duration. You can revoke access at any time.
          </p>
        </div>
        
        <div className="mt-4 flex items-start">
          <Checkbox
            id="limit-scope" 
            checked={limitScope}
            onCheckedChange={(checked) => setLimitScope(checked as boolean)}
          />
          <div className="ml-3">
            <Label 
              htmlFor="limit-scope" 
              className="font-medium"
            >
              Limit access to specialty-related records only
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only records related to {request.doctor?.specialty || "the doctor's specialty"} will be accessible
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="destructive" 
            onClick={handleDeny}
            disabled={updateRequestMutation.isPending}
          >
            Deny Access
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={updateRequestMutation.isPending}
          >
            {updateRequestMutation.isPending ? "Processing..." : "Approve Access"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
