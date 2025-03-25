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
    <Card className="hover:shadow-card transition-all-200 border border-border/40 dark:border-border/30">
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {doctorName} • {formatDate(recordDate)}
            </p>
            {notes && (
              <p className="mt-2 text-sm text-foreground/80 dark:text-foreground/75">
                {truncateText(notes, 100)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                className={`${getRecordTypeBadgeColor(recordType)} font-medium transition-colors`}
                variant="outline"
              >
                {recordType}
              </Badge>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <Badge
              variant="outline"
              className={
                verified
                  ? "bg-success/10 border-success/20 text-success hover:bg-success/15"
                  : "bg-warning/10 border-warning/20 text-warning hover:bg-warning/15"
              }
            >
              {verified ? "Verified" : "Pending"}
            </Badge>
            <div className="flex mt-3 space-x-1 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView && onView(id)}
                className="text-muted-foreground hover:text-primary transition-colors h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload && onDownload(id)}
                className="text-muted-foreground hover:text-primary transition-colors h-8 w-8 p-0"
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
