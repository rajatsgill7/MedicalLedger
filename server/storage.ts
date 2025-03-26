import { 
  users, User, InsertUser, 
  records, Record, InsertRecord,
  accessRequests, AccessRequest, InsertAccessRequest,
  auditLogs, AuditLog, InsertAuditLog, UserRole,
  NotificationPreferences, parseNotificationPrefs, notificationPrefsToString
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for database operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
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
  sessionStore: any;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;
    
    // Parse notification preferences using the helper function and attach as non-DB field
    const parsedUser = { ...user };
    
    // Set the property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: parseNotificationPrefs(user.notificationPreferences)
    });
    
    return parsedUser as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    if (!user) return undefined;
    
    // Parse notification preferences using the helper function and attach as non-DB field
    const parsedUser = { ...user };
    
    // Set the property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: parseNotificationPrefs(user.notificationPreferences)
    });
    
    return parsedUser as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) return undefined;
    
    // Parse notification preferences using the helper function and attach as non-DB field
    const parsedUser = { ...user };
    
    // Set the property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: parseNotificationPrefs(user.notificationPreferences)
    });
    
    return parsedUser as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure role is always set
    const role = insertUser.role || UserRole.PATIENT;
    // Ensure specialty is set to null if not provided
    const specialty = insertUser.specialty === undefined ? null : insertUser.specialty;
    
    // Set default notification preferences using the helper
    const defaultPrefs = notificationPrefsToString({
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    });
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role,
        specialty,
        notificationPreferences: defaultPrefs,
        createdAt: new Date()
      })
      .returning();
      
    // Parse notification preferences using the helper function and attach as non-DB field
    const parsedUser = { ...user };
    
    // Set the property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: parseNotificationPrefs(user.notificationPreferences)
    });
    
    return parsedUser as User;
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    // Handle notificationPreferences separately to convert to JSON string
    const { notificationPreferences: updatedPrefs, ...otherUpdates } = update;
    
    // Get the current user first
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
      
    if (!currentUser) return undefined;

    // Prepare the database update
    let dbUpdate: any = { ...otherUpdates };
    
    // If notification preferences are being updated
    if (updatedPrefs) {
      // Parse current preferences or use defaults
      const existingPrefs = parseNotificationPrefs(currentUser.notificationPreferences);
      
      // Merge new preferences with existing ones (safely cast to object types first)
      const mergedPrefs = {
        ...(existingPrefs as object),
        ...(updatedPrefs as object)
      } as NotificationPreferences;
      
      console.log('Merged notification preferences:', mergedPrefs);
      
      // Serialize to JSON string for storage using helper function
      dbUpdate.notificationPreferences = notificationPrefsToString(mergedPrefs);
    }
    
    // If there are database fields to update, perform the update
    if (Object.keys(dbUpdate).length > 0) {
      const [updatedUser] = await db
        .update(users)
        .set(dbUpdate)
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) return undefined;
      
      // Parse notification preferences using the helper function and attach as non-DB field
      const parsedUser = { ...updatedUser };
      
      // Set the property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedUser, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(updatedUser.notificationPreferences)
      });
      
      return parsedUser as User;
    }
    
    // If no updates were made, return the current user with parsed preferences
    const parsedUser = { ...currentUser };
    
    // Set the property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: parseNotificationPrefs(currentUser.notificationPreferences)
    });
    
    return parsedUser as User;
  }

  async getAllUsers(): Promise<User[]> {
    const userList = await db.select().from(users);
    
    // Process each user to have proper notification preferences
    return userList.map(user => {
      // Create a new object with all user properties
      const parsedUser = { ...user };
      
      // Set the notification preferences property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedUser, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(user.notificationPreferences)
      });
      
      return parsedUser as User;
    });
  }
  
  async getDoctors(): Promise<User[]> {
    const doctors = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.DOCTOR));
      
    // Process each doctor to have proper notification preferences
    return doctors.map(doctor => {
      // Create a new object with all doctor properties
      const parsedDoctor = { ...doctor };
      
      // Set the notification preferences property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedDoctor, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(doctor.notificationPreferences)
      });
      
      return parsedDoctor as User;
    });
  }
  
  // Record operations
  async getRecord(id: number): Promise<Record | undefined> {
    const [record] = await db
      .select()
      .from(records)
      .where(eq(records.id, id));
    return record;
  }
  
  async getRecordsByPatientId(patientId: number): Promise<Record[]> {
    return await db
      .select()
      .from(records)
      .where(eq(records.patientId, patientId));
  }
  
  async getRecordsByDoctorId(doctorId: number): Promise<Record[]> {
    return await db
      .select()
      .from(records)
      .where(eq(records.doctorId, doctorId));
  }
  
  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    // Set default values for fields
    const doctorId = insertRecord.doctorId === undefined ? null : insertRecord.doctorId;
    const doctorName = insertRecord.doctorName === undefined ? null : insertRecord.doctorName;
    const notes = insertRecord.notes === undefined ? null : insertRecord.notes;
    const fileUrl = insertRecord.fileUrl === undefined ? null : insertRecord.fileUrl;
    
    const [record] = await db
      .insert(records)
      .values({
        ...insertRecord,
        doctorId,
        doctorName,
        notes,
        fileUrl,
        verified: false, // Default to false if not provided
        createdAt: new Date()
      })
      .returning();
    return record;
  }
  
  async updateRecord(id: number, update: Partial<Record>): Promise<Record | undefined> {
    const [updatedRecord] = await db
      .update(records)
      .set(update)
      .where(eq(records.id, id))
      .returning();
    return updatedRecord;
  }
  
  // Access request operations
  async getAccessRequest(id: number): Promise<AccessRequest | undefined> {
    const [request] = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, id));
    return request;
  }
  
  async getAccessRequestsByPatientId(patientId: number): Promise<AccessRequest[]> {
    const requests = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.patientId, patientId))
      .orderBy(desc(accessRequests.requestDate));
      
    // Enrich with doctor info
    const doctorIds = Array.from(new Set(requests.map(req => req.doctorId)));
    
    const doctors = doctorIds.length > 0 
      ? await db.select().from(users).where(
          and(
            eq(users.role, UserRole.DOCTOR),
            // Fetch all doctors and filter them in memory since some versions of 
            // Drizzle don't have a good 'in' operator implementation
            eq(users.role, UserRole.DOCTOR)
          )
        ).then(allDoctors => allDoctors.filter(doctor => doctorIds.includes(doctor.id)))
      : [];
    
    // Process notification preferences for each doctor using helper function
    const doctorsWithPrefs = doctors.map(doctor => {
      // Create a new object with all doctor properties
      const parsedDoctor = { ...doctor };
      
      // Set the notification preferences property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedDoctor, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(doctor.notificationPreferences)
      });
      
      return parsedDoctor as User;
    });
    
    // Create doctor lookup map
    const doctorMap = new Map();
    doctorsWithPrefs.forEach(doctor => doctorMap.set(doctor.id, doctor));
    
    // Add doctor info to each request
    return requests.map(request => ({
      ...request,
      doctor: doctorMap.get(request.doctorId)
    }));
  }
  
  async getAccessRequestsByDoctorId(doctorId: number): Promise<AccessRequest[]> {
    const requests = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.doctorId, doctorId))
      .orderBy(desc(accessRequests.requestDate));
      
    // Enrich with patient info
    const patientIds = Array.from(new Set(requests.map(req => req.patientId)));
    
    const patients = patientIds.length > 0 
      ? await db.select().from(users).where(
          and(
            eq(users.role, UserRole.PATIENT),
            // Fetch all patients and filter them in memory
            eq(users.role, UserRole.PATIENT)
          )
        ).then(allPatients => allPatients.filter(patient => patientIds.includes(patient.id)))
      : [];
    
    // Process notification preferences for each patient using helper function
    const patientsWithPrefs = patients.map(patient => {
      // Create a new object with all patient properties
      const parsedPatient = { ...patient };
      
      // Set the notification preferences property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedPatient, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(patient.notificationPreferences)
      });
      
      return parsedPatient as User;
    });
    
    // Create patient lookup map
    const patientMap = new Map();
    patientsWithPrefs.forEach(patient => patientMap.set(patient.id, patient));
    
    // Add patient info to each request
    return requests.map(request => ({
      ...request,
      patient: patientMap.get(request.patientId)
    }));
  }
  
  async getActiveAccessRequests(doctorId: number, patientId: number): Promise<AccessRequest[]> {
    const now = new Date();
    
    // First, get all approved requests
    const requests = await db
      .select()
      .from(accessRequests)
      .where(
        and(
          eq(accessRequests.doctorId, doctorId),
          eq(accessRequests.patientId, patientId),
          eq(accessRequests.status, "approved")
        )
      );
    
    // Then filter out expired ones in the application code since SQL handling of null dates is tricky
    return requests.filter(request => 
      !request.expiryDate || (request.expiryDate instanceof Date && request.expiryDate > now)
    );
  }
  
  async hasAccess(doctorId: number, patientId: number): Promise<boolean> {
    const activeRequests = await this.getActiveAccessRequests(doctorId, patientId);
    return activeRequests.length > 0;
  }
  
  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    // Set default status if not provided
    const status = insertRequest.status || "pending";
    
    // Calculate expiry date if approved and duration is set
    let expiryDate: Date | null = null;
    if (status === "approved" && insertRequest.duration) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + insertRequest.duration);
    }
    
    // Set default values for optional fields
    const notes = insertRequest.notes === undefined ? null : insertRequest.notes;
    const limitedScope = insertRequest.limitedScope === undefined ? null : insertRequest.limitedScope;
    
    const [request] = await db
      .insert(accessRequests)
      .values({
        ...insertRequest,
        status,
        notes,
        limitedScope,
        requestDate: new Date(),
        expiryDate
      })
      .returning();
    
    return request;
  }
  
  async updateAccessRequest(id: number, update: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const [currentRequest] = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, id));
    
    if (!currentRequest) return undefined;
    
    // If status is being changed to approved, calculate expiry date
    let expiryDate = currentRequest.expiryDate;
    if (update.status === "approved" && currentRequest.status !== "approved") {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (currentRequest.duration || 30)); // Default to 30 days
    }
    
    const [updatedRequest] = await db
      .update(accessRequests)
      .set({
        ...update,
        expiryDate
      })
      .where(eq(accessRequests.id, id))
      .returning();
    
    return updatedRequest;
  }
  
  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    // Set default values for optional fields
    const details = insertLog.details === undefined ? null : insertLog.details;
    const ipAddress = insertLog.ipAddress === undefined ? null : insertLog.ipAddress;
    
    const [log] = await db
      .insert(auditLogs)
      .values({
        ...insertLog,
        details,
        ipAddress,
        timestamp: new Date()
      })
      .returning();
    
    return log;
  }
  
  async getAuditLogs(): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp));
  }
  
  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp));
  }
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
  sessionStore: any;

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
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    // Create a copy of the user
    const parsedUser = { ...user };
    
    // Default notification preferences
    const prefs = user.notificationPreferences || {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    };
    
    // Set the notification preferences property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: prefs
    });
    
    return parsedUser as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
    
    if (!user) return undefined;
    
    // Create a copy of the user
    const parsedUser = { ...user };
    
    // Default notification preferences
    const prefs = user.notificationPreferences || {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    };
    
    // Set the notification preferences property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: prefs
    });
    
    return parsedUser as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!user) return undefined;
    
    // Create a copy of the user
    const parsedUser = { ...user };
    
    // Default notification preferences
    const prefs = user.notificationPreferences || {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    };
    
    // Set the notification preferences property after spreading to avoid TypeScript issues
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: prefs
    });
    
    return parsedUser as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    // Ensure role is always set
    const role = insertUser.role || UserRole.PATIENT;
    // Ensure specialty is set to null if not provided
    const specialty = insertUser.specialty === undefined ? null : insertUser.specialty;
    
    // Store standardized notification preferences as a field
    const notificationPreferences = notificationPrefsToString({
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    });
    
    // Create base user without notification preferences first
    const baseUser = { 
      ...insertUser, 
      id, 
      createdAt, 
      role,
      specialty,
      notificationPreferences
    };
    
    // Store the user in the map
    this.usersMap.set(id, baseUser);
    
    // Create a copy of the user for return
    const parsedUser = { ...baseUser };
    
    // Set the proper notification preferences property after spreading
    Object.defineProperty(parsedUser, 'notificationPreferences', {
      enumerable: true,
      value: {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      }
    });
    
    return parsedUser as User;
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    // Handle notification preferences separately
    const { notificationPreferences: updatedPrefs, ...otherUpdates } = update;
    
    // Get a copy of the current user
    const updatedUser = { ...user };
    
    // Apply regular updates
    Object.assign(updatedUser, otherUpdates);
    
    // Apply notification preferences updates if provided
    if (updatedPrefs) {
      // Parse existing preferences from stored string representation
      const existingPrefs = parseNotificationPrefs(user.notificationPreferences);
      
      // Merge preferences 
      const mergedPrefs = {
        ...(existingPrefs || {}),
        ...(updatedPrefs || {})
      };
      
      // Store serialized preferences
      updatedUser.notificationPreferences = notificationPrefsToString(mergedPrefs);
    }
    
    // Update the store
    this.usersMap.set(id, updatedUser);
    
    // Create a parsed copy for return
    const returnUser = { ...updatedUser };
    
    // Set the parsed notification preferences
    Object.defineProperty(returnUser, 'notificationPreferences', {
      enumerable: true,
      value: parseNotificationPrefs(updatedUser.notificationPreferences)
    });
    
    return returnUser as User;
  }
  
  async getAllUsers(): Promise<User[]> {
    // Get all users from the map
    const userList = Array.from(this.usersMap.values());
    
    // Process each user to have proper notification preferences
    return userList.map(user => {
      // Create a new object with all user properties
      const parsedUser = { ...user };
      
      // Set the notification preferences property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedUser, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(user.notificationPreferences)
      });
      
      return parsedUser as User;
    });
  }
  
  async getDoctors(): Promise<User[]> {
    // Get all doctors from the map
    const doctorList = Array.from(this.usersMap.values()).filter(
      (user) => user.role === UserRole.DOCTOR
    );
    
    // Process each doctor to have proper notification preferences
    return doctorList.map(doctor => {
      // Create a new object with all doctor properties
      const parsedDoctor = { ...doctor };
      
      // Set the notification preferences property after spreading to avoid TypeScript issues
      Object.defineProperty(parsedDoctor, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(doctor.notificationPreferences)
      });
      
      return parsedDoctor as User;
    });
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
    
    // Set default values for fields
    const doctorId = insertRecord.doctorId === undefined ? null : insertRecord.doctorId;
    const doctorName = insertRecord.doctorName === undefined ? null : insertRecord.doctorName;
    const notes = insertRecord.notes === undefined ? null : insertRecord.notes;
    const fileUrl = insertRecord.fileUrl === undefined ? null : insertRecord.fileUrl;
    
    const record: Record = { 
      ...insertRecord, 
      id, 
      createdAt,
      doctorId,
      doctorName,
      notes,
      fileUrl,
      verified: false // Default to false if not provided
    };
    
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
    const requests = Array.from(this.accessRequestsMap.values())
      .filter(request => request.patientId === patientId)
      .sort((a, b) => {
        // Sort by requestDate descending
        const aTime = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const bTime = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return bTime - aTime;
      });
    
    // Enrich with doctor info
    const doctorIds = [...new Set(requests.map(req => req.doctorId))];
    const rawDoctors = Array.from(this.usersMap.values())
      .filter(user => user.role === UserRole.DOCTOR && doctorIds.includes(user.id));
    
    // Process notification preferences for each doctor
    const doctors = rawDoctors.map(doctor => {
      const parsedDoctor = { ...doctor };
      
      // Set the notification preferences property using helper function
      Object.defineProperty(parsedDoctor, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(doctor.notificationPreferences)
      });
      
      return parsedDoctor as User;
    });
    
    // Create doctor lookup map
    const doctorMap = new Map();
    doctors.forEach(doctor => doctorMap.set(doctor.id, doctor));
    
    // Add doctor info to each request
    return requests.map(request => ({
      ...request,
      doctor: doctorMap.get(request.doctorId)
    }));
  }
  
  async getAccessRequestsByDoctorId(doctorId: number): Promise<AccessRequest[]> {
    const requests = Array.from(this.accessRequestsMap.values())
      .filter(request => request.doctorId === doctorId)
      .sort((a, b) => {
        // Sort by requestDate descending
        const aTime = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const bTime = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return bTime - aTime;
      });
    
    // Enrich with patient info
    const patientIds = [...new Set(requests.map(req => req.patientId))];
    const rawPatients = Array.from(this.usersMap.values())
      .filter(user => user.role === UserRole.PATIENT && patientIds.includes(user.id));
    
    // Process notification preferences for each patient
    const patients = rawPatients.map(patient => {
      const parsedPatient = { ...patient };
      
      // Set the notification preferences property using helper function
      Object.defineProperty(parsedPatient, 'notificationPreferences', {
        enumerable: true,
        value: parseNotificationPrefs(patient.notificationPreferences)
      });
      
      return parsedPatient as User;
    });
    
    // Create patient lookup map
    const patientMap = new Map();
    patients.forEach(patient => patientMap.set(patient.id, patient));
    
    // Add patient info to each request
    return requests.map(request => ({
      ...request,
      patient: patientMap.get(request.patientId)
    }));
  }
  
  async getActiveAccessRequests(doctorId: number, patientId: number): Promise<AccessRequest[]> {
    const now = new Date();
    return Array.from(this.accessRequestsMap.values()).filter(
      (request) => 
        request.doctorId === doctorId && 
        request.patientId === patientId &&
        request.status === "approved" &&
        (!request.expiryDate || (request.expiryDate instanceof Date && request.expiryDate > now))
    );
  }
  
  async hasAccess(doctorId: number, patientId: number): Promise<boolean> {
    const activeRequests = await this.getActiveAccessRequests(doctorId, patientId);
    return activeRequests.length > 0;
  }
  
  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = this.accessRequestIdCounter++;
    const requestDate = new Date();
    
    // Set default status if not provided
    const status = insertRequest.status || "pending";
    
    // Calculate expiry date if approved and duration is set
    let expiryDate: Date | null = null;
    if (status === "approved" && insertRequest.duration) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + insertRequest.duration);
    }
    
    // Set default values for optional fields
    const notes = insertRequest.notes === undefined ? null : insertRequest.notes;
    const limitedScope = insertRequest.limitedScope === undefined ? null : insertRequest.limitedScope;
    
    const request: AccessRequest = { 
      ...insertRequest, 
      id, 
      status,
      requestDate,
      expiryDate,
      notes,
      limitedScope
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
    
    // Set default values for optional fields
    const details = insertLog.details === undefined ? null : insertLog.details;
    const ipAddress = insertLog.ipAddress === undefined ? null : insertLog.ipAddress;
    
    const log: AuditLog = { 
      ...insertLog, 
      id, 
      timestamp,
      details,
      ipAddress
    };
    
    this.auditLogsMap.set(id, log);
    return log;
  }
  
  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .sort((a, b) => {
        // Handle null timestamps
        const aTime = a.timestamp ? a.timestamp.getTime() : 0;
        const bTime = b.timestamp ? b.timestamp.getTime() : 0;
        return bTime - aTime;
      });
  }
  
  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => {
        // Handle null timestamps
        const aTime = a.timestamp ? a.timestamp.getTime() : 0;
        const bTime = b.timestamp ? b.timestamp.getTime() : 0;
        return bTime - aTime;
      });
  }
}

// Use database storage
export const storage = new DatabaseStorage();
