import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "denied":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "expired":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    default:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  }
}

export function getRoleBadgeColor(role: string) {
  switch (role.toLowerCase()) {
    case "patient":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "doctor":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "admin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}

export function getRecordTypeBadgeColor(type: string) {
  switch (type.toLowerCase()) {
    case "lab results":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "prescription":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "imaging":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
    case "general checkup":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "specialist consultation":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "vaccination":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
    case "surgical report":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  }
}
