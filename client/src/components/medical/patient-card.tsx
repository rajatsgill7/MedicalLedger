
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon } from "lucide-react";

interface PatientCardProps {
  patient: {
    id: string;
    fullName: string;
    age?: number;
    lastVisit?: string;
    accessStatus?: string;
    accessUntil?: string;
  };
}

export function PatientCard({ patient }: PatientCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {patient.fullName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Patient ID: {patient.id}
            </p>
          </div>
        </div>

        {patient.accessStatus === "active" ? (
          <Badge 
            className="mt-4 w-full justify-center py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full"
            variant="outline"
          >
            Has Access
          </Badge>
        ) : (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            No active access
          </p>
        )}

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
