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
}

export function PatientCard({ patient, onViewRecords, onAccessHistory }: PatientProps) {
  // Determine status badge styling
  const getStatusBadge = () => {
    switch (patient.accessStatus) {
      case "active":
        return (
          <Badge 
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            Active Access
          </Badge>
        );
      case "pending":
        return (
          <Badge 
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            Pending Approval
          </Badge>
        );
      case "expired":
        return (
          <Badge 
            variant="outline"
            className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          >
            Expired
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            No Access
          </Badge>
        );
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <UserCog className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{patient.fullName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">ID: P-{patient.id.toString().padStart(5, '0')}</p>
              </div>
            </div>
            <div>
              {getStatusBadge()}
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {patient.age && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Age</p>
                <p className="font-medium text-gray-900 dark:text-white">{patient.age}</p>
              </div>
            )}
            {patient.lastVisit && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Visit</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(patient.lastVisit)}</p>
              </div>
            )}
            {patient.accessStatus === "active" && patient.accessUntil && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Access Until</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(patient.accessUntil)}</p>
              </div>
            )}
            {patient.accessStatus === "pending" && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Status</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Records</p>
              <p className="font-medium text-gray-900 dark:text-white">{patient.recordCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 flex justify-between">
          {patient.accessStatus === "active" ? (
            <>
              <Button 
                variant="link"
                className="text-primary dark:text-primary-light font-medium"
                onClick={onViewRecords}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Records
              </Button>
              {onAccessHistory && (
                <Button 
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 font-medium"
                  onClick={onAccessHistory}
                >
                  <History className="h-4 w-4 mr-1" />
                  Access History
                </Button>
              )}
            </>
          ) : patient.accessStatus === "pending" ? (
            <Button 
              variant="link"
              className="text-gray-600 dark:text-gray-300 font-medium mx-auto"
              onClick={() => {}}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Check Status
            </Button>
          ) : patient.accessStatus === "expired" ? (
            <Button 
              variant="link"
              className="text-primary dark:text-primary-light font-medium mx-auto"
              onClick={() => {}}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Request New Access
            </Button>
          ) : (
            <Button 
              variant="link"
              className="text-primary dark:text-primary-light font-medium mx-auto"
              onClick={() => {}}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Request Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
