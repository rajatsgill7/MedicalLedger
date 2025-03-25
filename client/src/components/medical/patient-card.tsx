import { useState } from "react";
import { User as UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

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
  getStatusBadge: () => JSX.Element;
}

export function PatientCard({ patient, getStatusBadge }: PatientProps) {
  return (
    <Card className="overflow-hidden border border-border/40 hover:border-border/60 dark:border-border/30 dark:hover:border-border/50 hover:shadow-card transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserCog className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-foreground">{patient.fullName}</h3>
              <p className="text-sm text-muted-foreground">ID: P-{patient.id.toString().padStart(5, '0')}</p>
            </div>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
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
        </div>
      </CardContent>
    </Card>
  );
}