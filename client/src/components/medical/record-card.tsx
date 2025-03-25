import { getRecordTypeBadgeColor, formatDate, truncateText } from "@/lib/utils";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecordCardProps {
  id: number;
  title: string;
  recordType: string;
  doctorName: string;
  recordDate: string;
  notes?: string;
  verified: boolean;
  onView?: (id: number) => void;
  onDownload?: (id: number) => void;
}

export function RecordCard({
  id,
  title,
  recordType,
  doctorName,
  recordDate,
  notes,
  verified,
  onView,
  onDownload,
}: RecordCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {doctorName} • {formatDate(recordDate)}
            </p>
            {notes && (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {truncateText(notes, 100)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                className={getRecordTypeBadgeColor(recordType)}
                variant="outline"
              >
                {recordType}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant="outline"
              className={
                verified
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }
            >
              {verified ? "Verified" : "Pending"}
            </Badge>
            <div className="flex mt-2 space-x-2 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView && onView(id)}
                className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDownload && onDownload(id)}
                className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
