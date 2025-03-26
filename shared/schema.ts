import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types
export const UserRole = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Profile settings type
export type ProfileSettings = {
  fullName: string;
  email: string;
  phone?: string | null;
  specialty?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
  bio?: string | null;
  lastUpdated?: string | null;
};

// Security settings type
export type SecuritySettings = {
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'sms' | 'email' | 'app' | null;
  lastPasswordChange?: string | null;
  passwordStrength?: 'weak' | 'medium' | 'strong' | null;
  requiredReauthForSensitive?: boolean;
  ipRestrictions?: string[] | null;
  sessionTimeout?: number | null; // in minutes
  securityQuestions?: Array<{question: string, answer: string}> | null;
  recoveryCodesGenerated?: boolean;
};

// Notification preferences type
export type NotificationPreferences = {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  accessRequestAlerts?: boolean;
  securityAlerts?: boolean;
  newRecordAlerts?: boolean;
  systemUpdates?: boolean;
  marketingEmails?: boolean;
  communicationPreference?: 'email' | 'sms' | 'both' | 'none';
  quietHours?: {
    enabled: boolean;
    start?: string;
    end?: string;
    timezone?: string;
  };
};

// Combine all user settings
export type UserSettings = {
  profile?: ProfileSettings;
  security?: SecuritySettings;
  notifications?: NotificationPreferences;
};

// Function to convert user settings to a JSON string
export function userSettingsToString(settings: UserSettings): string {
  return JSON.stringify(settings);
}

// Function to parse user settings from a string or object
export function parseUserSettings(settingsInput: string | object | null): UserSettings {
  const defaultSettings: UserSettings = {
    profile: {
      fullName: '',
      email: '',
    },
    security: {
      twoFactorEnabled: false,
      requiredReauthForSensitive: true,
      recoveryCodesGenerated: false
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true,
      newRecordAlerts: true,
      systemUpdates: true,
      marketingEmails: false,
      communicationPreference: 'email',
      quietHours: {
        enabled: false
      }
    }
  };
  
  if (!settingsInput) return defaultSettings;
  
  try {
    // If it's already an object, use it directly
    if (typeof settingsInput === 'object') {
      return {
        ...defaultSettings,
        ...settingsInput
      };
    }
    
    // Otherwise parse it as JSON string
    return {
      ...defaultSettings,
      ...JSON.parse(settingsInput)
    };
  } catch (e) {
    console.error('Error parsing user settings:', e);
    return defaultSettings;
  }
}

// Removed legacy notification preference handling

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default(UserRole.PATIENT),
  createdAt: timestamp("created_at").defaultNow(),
  userSettings: jsonb("user_settings"), // All settings in a unified JSON structure (contains fullName, email, specialty, phone, etc.)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  userSettings: true,
});

// Records table
export const records = pgTable("records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(), // User ID of the patient
  title: text("title").notNull(),
  recordType: text("record_type").notNull(),
  doctorId: integer("doctor_id"), // User ID of the doctor
  doctorName: text("doctor_name"),
  recordDate: date("record_date").notNull(),
  notes: text("notes"),
  fileUrl: text("file_url"), // We'll store URLs in-memory for this MVP
  createdAt: timestamp("created_at").defaultNow(),
  verified: boolean("verified").default(false),
});

export const insertRecordSchema = createInsertSchema(records).pick({
  patientId: true,
  title: true,
  recordType: true,
  doctorId: true,
  doctorName: true,
  recordDate: true,
  notes: true,
  fileUrl: true,
  verified: true,
});

// Access requests table
export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  patientId: integer("patient_id").notNull(),
  purpose: text("purpose").notNull(),
  duration: integer("duration").notNull(), // Duration in days
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending, approved, denied
  requestDate: timestamp("request_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  limitedScope: boolean("limited_scope").default(false),
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).pick({
  doctorId: true,
  patientId: true,
  purpose: true,
  duration: true,
  notes: true,
  status: true,
  limitedScope: true,
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: text("ip_address"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  details: true,
  ipAddress: true,
});

// Defining types for TypeScript
export type User = typeof users.$inferSelect & {
  settings?: UserSettings;
  // These are derived from userSettings.profile
  fullName?: string;
  email?: string;
  specialty?: string | null;
  phone?: string | null;
};
export type InsertUser = z.infer<typeof insertUserSchema> & {
  fullName: string;
  email: string;
  specialty?: string | null;
  phone?: string | null;
};

export type Record = typeof records.$inferSelect;
export type InsertRecord = z.infer<typeof insertRecordSchema>;

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
