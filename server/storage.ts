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
    
    // Default notification preferences
    let notificationPreferences: NotificationPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    };
    
    // Try to parse notification preferences from JSON if they exist
    if (user.notificationPreferences) {
      try {
        notificationPreferences = {
          ...notificationPreferences,
          ...JSON.parse(user.notificationPreferences)
        };
      } catch (e) {
        console.error('Error parsing notification preferences:', e);
      }
    }
    
    return {
      ...user,
      notificationPreferences
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    
    if (!user) return undefined;
    
    // Default notification preferences
    let notificationPreferences: NotificationPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    };
    
    // Try to parse notification preferences from JSON if they exist
    if (user.notificationPreferences) {
      try {
        if (typeof user.notificationPreferences === 'string') {
          // It's a JSON string, parse it
          notificationPreferences = {
            ...notificationPreferences,
            ...JSON.parse(user.notificationPreferences)
          };
        } else if (typeof user.notificationPreferences === 'object' && 
                  !Array.isArray(user.notificationPreferences) && 
                  user.notificationPreferences !== null) {
          // It's already an object
          if ('emailNotifications' in user.notificationPreferences || 
              'smsNotifications' in user.notificationPreferences ||
              'accessRequestAlerts' in user.notificationPreferences ||
              'securityAlerts' in user.notificationPreferences) {
            // If it has the expected properties, use it directly
            notificationPreferences = {
              ...notificationPreferences,
              ...user.notificationPreferences as any
            };
          } else if (Object.keys(user.notificationPreferences).length > 0 && 
                    Object.keys(user.notificationPreferences).some(key => !isNaN(Number(key)))) {
            // It appears to be a character-by-character array, rebuild the string
            const jsonStr = Object.values(user.notificationPreferences).join('');
            // Check if it looks like a valid JSON string
            if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
              try {
                notificationPreferences = {
                  ...notificationPreferences,
                  ...JSON.parse(jsonStr)
                };
              } catch (e) {
                console.error('Error parsing rebuilt JSON string:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing notification preferences:', e);
      }
    }
    
    return {
      ...user,
      notificationPreferences
    };
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    if (!user) return undefined;
    
    // Default notification preferences
    let notificationPreferences: NotificationPreferences = {
      emailNotifications: true,
      smsNotifications: false,
      accessRequestAlerts: true,
      securityAlerts: true
    };
    
    // Try to parse notification preferences from JSON if they exist
    if (user.notificationPreferences) {
      try {
        if (typeof user.notificationPreferences === 'string') {
          // It's a JSON string, parse it
          notificationPreferences = {
            ...notificationPreferences,
            ...JSON.parse(user.notificationPreferences)
          };
        } else if (typeof user.notificationPreferences === 'object' && 
                  !Array.isArray(user.notificationPreferences) && 
                  user.notificationPreferences !== null) {
          // It's already an object
          if ('emailNotifications' in user.notificationPreferences || 
              'smsNotifications' in user.notificationPreferences ||
              'accessRequestAlerts' in user.notificationPreferences ||
              'securityAlerts' in user.notificationPreferences) {
            // If it has the expected properties, use it directly
            notificationPreferences = {
              ...notificationPreferences,
              ...user.notificationPreferences as any
            };
          } else if (Object.keys(user.notificationPreferences).length > 0 && 
                    Object.keys(user.notificationPreferences).some(key => !isNaN(Number(key)))) {
            // It appears to be a character-by-character array, rebuild the string
            const jsonStr = Object.values(user.notificationPreferences).join('');
            // Check if it looks like a valid JSON string
            if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
              try {
                notificationPreferences = {
                  ...notificationPreferences,
                  ...JSON.parse(jsonStr)
                };
              } catch (e) {
                console.error('Error parsing rebuilt JSON string:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing notification preferences:', e);
      }
    }
    
    return {
      ...user,
      notificationPreferences
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure role is always set
    const role = insertUser.role || UserRole.PATIENT;
    // Ensure specialty is set to null if not provided
    const specialty = insertUser.specialty === undefined ? null : insertUser.specialty;
    
    // Set default notification preferences
    const defaultPrefs = JSON.stringify({
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
      
    // Parse the notification preferences from the stored JSON
    let notificationPreferences = {};
    if (user.notificationPreferences) {
      try {
        notificationPreferences = JSON.parse(user.notificationPreferences);
      } catch (e) {
        console.error('Error parsing notification preferences', e);
      }
    }
    
    // Return user with parsed notification preferences
    return {
      ...user,
      notificationPreferences
    };
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    // Handle notificationPreferences separately to convert to JSON string
    const { notificationPreferences, ...otherUpdates } = update;
    
    // Get the current user first
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
      
    if (!currentUser) return undefined;

    // Prepare the database update
    let dbUpdate: any = { ...otherUpdates };
    
    // If notification preferences are being updated
    if (notificationPreferences) {
      // Get existing preferences or use defaults
      let existingPrefs: NotificationPreferences = { 
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
      
      try {
        // Try to parse existing preferences from JSON string if present
        if (currentUser.notificationPreferences) {
          existingPrefs = JSON.parse(currentUser.notificationPreferences);
        }
      } catch (e) {
        console.error('Error parsing existing notification preferences', e);
      }
      
      // Merge new preferences with existing ones
      const mergedPrefs = {
        ...existingPrefs,
        ...notificationPreferences
      };
      
      // Serialize to JSON string for storage
      dbUpdate.notificationPreferences = JSON.stringify(mergedPrefs);
    }
    
    // If there are database fields to update, perform the update
    if (Object.keys(dbUpdate).length > 0) {
      const [updatedUser] = await db
        .update(users)
        .set(dbUpdate)
        .where(eq(users.id, id))
        .returning();
      
      if (!updatedUser) return undefined;
      
      // Convert JSON string back to object for the returned user
      let returnedPrefs: NotificationPreferences | undefined = undefined;
      
      if (updatedUser.notificationPreferences) {
        try {
          returnedPrefs = JSON.parse(updatedUser.notificationPreferences);
        } catch (e) {
          console.error('Error parsing updated notification preferences', e);
        }
      }
      
      return {
        ...updatedUser,
        notificationPreferences: returnedPrefs
      };
    }
    
    // If no updates were made, return the current user
    let returnedPrefs: NotificationPreferences | undefined = undefined;
    if (currentUser.notificationPreferences) {
      try {
        returnedPrefs = JSON.parse(currentUser.notificationPreferences);
      } catch (e) {
        console.error('Error parsing current notification preferences', e);
      }
    }
    
    return {
      ...currentUser,
      notificationPreferences: returnedPrefs
    };
  }

  async getAllUsers(): Promise<User[]> {
    const userList = await db.select().from(users);
    
    // Parse notification preferences from JSON for each user
    return userList.map(user => {
      // Default notification preferences
      let notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
      
      // Try to parse notification preferences from JSON if they exist
      if (user.notificationPreferences) {
        try {
          notificationPreferences = {
            ...notificationPreferences,
            ...JSON.parse(user.notificationPreferences)
          };
        } catch (e) {
          console.error('Error parsing notification preferences:', e);
        }
      }
      
      return {
        ...user,
        notificationPreferences
      };
    });
  }
  
  async getDoctors(): Promise<User[]> {
    const doctors = await db
      .select()
      .from(users)
      .where(eq(users.role, UserRole.DOCTOR));
      
    // Parse notification preferences from JSON for each doctor
    return doctors.map(doctor => {
      // Default notification preferences
      let notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
      
      // Try to parse notification preferences from JSON if they exist
      if (doctor.notificationPreferences) {
        try {
          notificationPreferences = {
            ...notificationPreferences,
            ...JSON.parse(doctor.notificationPreferences)
          };
        } catch (e) {
          console.error('Error parsing notification preferences:', e);
        }
      }
      
      return {
        ...doctor,
        notificationPreferences
      };
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
    
    // Process notification preferences for each doctor
    const doctorsWithPrefs = doctors.map(doctor => {
      // Default notification preferences
      let notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
      
      // Try to parse notification preferences from JSON if they exist
      if (doctor.notificationPreferences) {
        try {
          notificationPreferences = {
            ...notificationPreferences,
            ...JSON.parse(doctor.notificationPreferences)
          };
        } catch (e) {
          console.error('Error parsing notification preferences:', e);
        }
      }
      
      return {
        ...doctor,
        notificationPreferences
      };
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
    
    // Process notification preferences for each patient
    const patientsWithPrefs = patients.map(patient => {
      // Default notification preferences
      let notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
      
      // Try to parse notification preferences from JSON if they exist
      if (patient.notificationPreferences) {
        try {
          notificationPreferences = {
            ...notificationPreferences,
            ...JSON.parse(patient.notificationPreferences)
          };
        } catch (e) {
          console.error('Error parsing notification preferences:', e);
        }
      }
      
      return {
        ...patient,
        notificationPreferences
      };
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
    
    // Get notification preferences or set defaults
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
    }
    
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.usersMap.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
    
    if (!user) return undefined;
    
    // Get notification preferences or set defaults
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
    }
    
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = Array.from(this.usersMap.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
    
    if (!user) return undefined;
    
    // Get notification preferences or set defaults
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      };
    }
    
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    // Ensure role is always set
    const role = insertUser.role || UserRole.PATIENT;
    // Ensure specialty is set to null if not provided
    const specialty = insertUser.specialty === undefined ? null : insertUser.specialty;
    
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      role,
      specialty,
      notificationPreferences: {
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      }
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    // Handle notification preferences separately, similar to database storage
    const { notificationPreferences, ...otherUpdates } = update;
    
    // Apply regular updates
    const updatedUser = { ...user, ...otherUpdates };
    
    // Apply notification preferences updates if provided
    if (notificationPreferences) {
      updatedUser.notificationPreferences = {
        ...user.notificationPreferences,
        ...notificationPreferences
      };
    }
    
    this.usersMap.set(id, updatedUser);
    return updatedUser;
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
    const doctors = Array.from(this.usersMap.values())
      .filter(user => user.role === UserRole.DOCTOR && doctorIds.includes(user.id));
    
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
    const patients = Array.from(this.usersMap.values())
      .filter(user => user.role === UserRole.PATIENT && patientIds.includes(user.id));
    
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
