import { 
  users, User, InsertUser, 
  records, Record, InsertRecord,
  accessRequests, AccessRequest, InsertAccessRequest,
  auditLogs, AuditLog, InsertAuditLog, UserRole
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getDoctors(): Promise<User[]>;
  
  // Record operations
  getRecord(id: number): Promise<Record | undefined>;
  getRecordsByPatientId(patientId: number): Promise<Record[]>;
  getRecordsByDoctorId(doctorId: number): Promise<Record[]>;
  createRecord(record: InsertRecord): Promise<Record>;
  updateRecord(id: number, record: Partial<Record>): Promise<Record | undefined>;
  
  // Access request operations
  getAccessRequest(id: number): Promise<AccessRequest | undefined>;
  getAccessRequestsByPatientId(patientId: number): Promise<AccessRequest[]>;
  getAccessRequestsByDoctorId(doctorId: number): Promise<AccessRequest[]>;
  getActiveAccessRequests(doctorId: number, patientId: number): Promise<AccessRequest[]>;
  hasAccess(doctorId: number, patientId: number): Promise<boolean>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  updateAccessRequest(id: number, request: Partial<AccessRequest>): Promise<AccessRequest | undefined>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;
  getAuditLogsByUserId(userId: number): Promise<AuditLog[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private recordsMap: Map<number, Record>;
  private accessRequestsMap: Map<number, AccessRequest>;
  private auditLogsMap: Map<number, AuditLog>;
  private userIdCounter: number;
  private recordIdCounter: number;
  private accessRequestIdCounter: number;
  private auditLogIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.recordsMap = new Map();
    this.accessRequestsMap = new Map();
    this.auditLogsMap = new Map();
    this.userIdCounter = 1;
    this.recordIdCounter = 1;
    this.accessRequestIdCounter = 1;
    this.auditLogIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed admin user
    this.createUser({
      username: 'admin',
      password: 'password', // Note: Will be hashed by auth.ts
      fullName: 'System Administrator',
      email: 'admin@medivault.com',
      role: UserRole.ADMIN
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.usersMap.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }
  
  async getDoctors(): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(
      (user) => user.role === UserRole.DOCTOR
    );
  }
  
  // Record operations
  async getRecord(id: number): Promise<Record | undefined> {
    return this.recordsMap.get(id);
  }
  
  async getRecordsByPatientId(patientId: number): Promise<Record[]> {
    return Array.from(this.recordsMap.values()).filter(
      (record) => record.patientId === patientId
    );
  }
  
  async getRecordsByDoctorId(doctorId: number): Promise<Record[]> {
    return Array.from(this.recordsMap.values()).filter(
      (record) => record.doctorId === doctorId
    );
  }
  
  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    const id = this.recordIdCounter++;
    const createdAt = new Date();
    const record: Record = { ...insertRecord, id, createdAt };
    this.recordsMap.set(id, record);
    return record;
  }
  
  async updateRecord(id: number, update: Partial<Record>): Promise<Record | undefined> {
    const record = this.recordsMap.get(id);
    if (!record) return undefined;
    
    const updated = { ...record, ...update };
    this.recordsMap.set(id, updated);
    return updated;
  }
  
  // Access request operations
  async getAccessRequest(id: number): Promise<AccessRequest | undefined> {
    return this.accessRequestsMap.get(id);
  }
  
  async getAccessRequestsByPatientId(patientId: number): Promise<AccessRequest[]> {
    return Array.from(this.accessRequestsMap.values()).filter(
      (request) => request.patientId === patientId
    );
  }
  
  async getAccessRequestsByDoctorId(doctorId: number): Promise<AccessRequest[]> {
    return Array.from(this.accessRequestsMap.values()).filter(
      (request) => request.doctorId === doctorId
    );
  }
  
  async getActiveAccessRequests(doctorId: number, patientId: number): Promise<AccessRequest[]> {
    const now = new Date();
    return Array.from(this.accessRequestsMap.values()).filter(
      (request) => 
        request.doctorId === doctorId && 
        request.patientId === patientId &&
        request.status === "approved" &&
        (request.expiryDate === undefined || new Date(request.expiryDate) > now)
    );
  }
  
  async hasAccess(doctorId: number, patientId: number): Promise<boolean> {
    const activeRequests = await this.getActiveAccessRequests(doctorId, patientId);
    return activeRequests.length > 0;
  }
  
  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = this.accessRequestIdCounter++;
    const requestDate = new Date();
    
    // Calculate expiry date if approved and duration is set
    let expiryDate: Date | undefined = undefined;
    if (insertRequest.status === "approved" && insertRequest.duration) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + insertRequest.duration);
    }
    
    const request: AccessRequest = { 
      ...insertRequest, 
      id, 
      requestDate,
      expiryDate 
    };
    
    this.accessRequestsMap.set(id, request);
    return request;
  }
  
  async updateAccessRequest(id: number, update: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const request = this.accessRequestsMap.get(id);
    if (!request) return undefined;
    
    // If status is being changed to approved, calculate expiry date
    let expiryDate = request.expiryDate;
    if (update.status === "approved" && request.status !== "approved") {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (request.duration || 30)); // Default to 30 days if not specified
    }
    
    const updated = { ...request, ...update, expiryDate };
    this.accessRequestsMap.set(id, updated);
    return updated;
  }
  
  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogIdCounter++;
    const timestamp = new Date();
    const log: AuditLog = { ...insertLog, id, timestamp };
    this.auditLogsMap.set(id, log);
    return log;
  }
  
  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const storage = new MemStorage();
