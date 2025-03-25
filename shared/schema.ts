import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types
export const UserRole = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default(UserRole.PATIENT),
  specialty: text("specialty"), // For doctors
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  specialty: true,
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Record = typeof records.$inferSelect;
export type InsertRecord = z.infer<typeof insertRecordSchema>;

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
