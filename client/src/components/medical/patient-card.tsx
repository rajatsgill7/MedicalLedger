import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  Eye,
  Clock,
  History,
  UserCog,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface PatientProps {
  patient: {
    id: number;
    fullName: string;
    accessStatus: string;
    recordCount: number;
    lastVisit?: string;
    accessUntil?: string;
    age?: number;
  };
  onViewRecords: () => void;
  onAccessHistory?: () => void;
  onRequestAccess?: () => void;
}

export function PatientCard({ patient, onViewRecords, onAccessHistory, onRequestAccess }: PatientProps) {
  // Determine status badge styling
  const getStatusBadge = () => {
    switch (patient.accessStatus) {
      case "active":
        return (
          <Badge 
            variant="outline"
            className="bg-success/10 border-success/20 text-success"
          >
            Active Access
          </Badge>
        );
      case "pending":
        return (
          <Badge 
            variant="outline"
            className="bg-warning/10 border-warning/20 text-warning"
          >
            Pending Approval
          </Badge>
        );
      case "expired":
        return (
          <Badge 
            variant="outline"
            className="bg-muted/30 border-muted/30 text-muted-foreground"
          >
            Expired
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline"
            className="border border-blue-300 dark:border-blue-800 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
          >
            No Access
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden border border-border/40 dark:border-border/30 hover:shadow-card transition-all-200">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                <UserCog className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-foreground mb-0.5">{patient.fullName}</h3>
                <p className="text-sm text-muted-foreground">ID: P-{patient.id.toString().padStart(5, '0')}</p>
              </div>
            </div>
            <div>
              {getStatusBadge()}
            </div>
          </div>
          
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {patient.age && (
              <div>
                <p className="text-muted-foreground mb-1">Age</p>
                <p className="font-medium text-foreground">{patient.age}</p>
              </div>
            )}
            {patient.lastVisit && (
              <div>
                <p className="text-muted-foreground mb-1">Last Visit</p>
                <p className="font-medium text-foreground">{formatDate(patient.lastVisit)}</p>
              </div>
            )}
            {patient.accessStatus === "active" && patient.accessUntil && (
              <div>
                <p className="text-muted-foreground mb-1">Access Until</p>
                <p className="font-medium text-foreground">{formatDate(patient.accessUntil)}</p>
              </div>
            )}
            {patient.accessStatus === "pending" && (
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <p className="font-medium text-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-warning" />
                  Awaiting
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1">Records</p>
              <p className="font-medium text-foreground">{patient.recordCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/20 dark:bg-muted/10 border-t border-border/30 px-5 py-3 flex justify-between">
          {patient.accessStatus === "active" ? (
            <>
              <Button 
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/90 hover:bg-background/80 font-medium"
                onClick={onViewRecords}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                View Records
              </Button>
              {onAccessHistory && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-background/80 font-medium"
                  onClick={onAccessHistory}
                >
                  <History className="h-4 w-4 mr-1.5" />
                  Access History
                </Button>
              )}
            </>
          ) : patient.accessStatus === "pending" ? (
            <Button 
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-background/80 font-medium mx-auto"
              onClick={() => {}}
            >
              <AlertCircle className="h-4 w-4 mr-1.5 text-warning" />
              Check Status
            </Button>
          ) : patient.accessStatus === "expired" ? (
            <Button 
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/90 hover:bg-background/80 font-medium mx-auto"
              onClick={onRequestAccess}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Request New Access
            </Button>
          ) : (
            <Button 
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/90 hover:bg-background/80 font-medium mx-auto"
              onClick={onRequestAccess}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Request Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
