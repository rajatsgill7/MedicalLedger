import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export const recordTypes = [
  "General Checkup",
  "Lab Results",
  "Prescription",
  "Imaging",
  "Specialist Consultation",
  "Vaccination",
  "Surgical Report",
];

export const accessPurposes = [
  "Initial Diagnosis",
  "Treatment",
  "Follow-up Care",
  "Consultation",
  "Emergency Care",
  "Routine Checkup",
];

export const accessDurations = [
  { label: "30 Days", value: 30 },
  { label: "60 Days", value: 60 },
  { label: "90 Days", value: 90 },
  { label: "6 Months", value: 180 },
];

export function getStatusBadgeColor(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-success/10 border-success/20 text-success";
    case "pending":
      return "bg-warning/10 border-warning/20 text-warning";
    case "denied":
      return "bg-destructive/10 border-destructive/20 text-destructive";
    case "expired":
      return "bg-muted/30 border-muted/30 text-muted-foreground";
    default:
      return "bg-info/10 border-info/20 text-info";
  }
}

export function getRoleBadgeColor(role: string) {
  switch (role.toLowerCase()) {
    case "patient":
      return "bg-info/10 border-info/20 text-info";
    case "doctor":
      return "bg-success/10 border-success/20 text-success";
    case "admin":
      return "bg-primary/10 border-primary/20 text-primary";
    default:
      return "bg-muted/30 border-muted/30 text-muted-foreground";
  }
}

export function getRecordTypeBadgeColor(type: string) {
  switch (type.toLowerCase()) {
    case "lab results":
      return "bg-destructive/10 border-destructive/20 text-destructive";
    case "prescription":
      return "bg-success/10 border-success/20 text-success";
    case "imaging":
      return "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50";
    case "general checkup":
      return "bg-info/10 border-info/20 text-info";
    case "specialist consultation":
      return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50";
    case "vaccination":
      return "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50";
    case "surgical report":
      return "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50";
    default:
      return "bg-muted/30 border-muted/30 text-muted-foreground";
  }
}
