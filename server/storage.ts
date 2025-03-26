import { 
  users, User, InsertUser, 
  records, Record, InsertRecord,
  accessRequests, AccessRequest, InsertAccessRequest,
  auditLogs, AuditLog, InsertAuditLog, UserRole,
  UserSettings, parseUserSettings, userSettingsToString
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
    try {
      // Get user from database
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return undefined;
      
      // Create a copy for adding virtual properties
      const parsedUser = { ...user };
      
      // Get settings from userSettings column (could be a string or object)
      const settings = parseUserSettings(parsedUser.userSettings);
      
      // Add settings property and virtual properties derived from settings
      const enhancedUser = {
        ...parsedUser,
        settings,
        fullName: settings?.profile?.fullName,
        email: settings?.profile?.email,
        specialty: settings?.profile?.specialty,
        phone: settings?.profile?.phone
      };
      
      return enhancedUser as User;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      if (!user) return undefined;
      
      // Create a copy for adding virtual properties
      const parsedUser = { ...user };
      
      // Get settings from userSettings column (could be a string or object)
      const settings = parseUserSettings(parsedUser.userSettings);
      
      // Add settings property and virtual properties derived from settings
      const enhancedUser = {
        ...parsedUser,
        settings,
        fullName: settings?.profile?.fullName,
        email: settings?.profile?.email,
        specialty: settings?.profile?.specialty,
        phone: settings?.profile?.phone
      };
      
      return enhancedUser as User;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // In the new structure, email is in the userSettings.profile
      // We need to get all users and filter by settings
      const users = await this.getAllUsers();
      const user = users.find(u => u.email === email);
      return user;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Ensure role is always set
      const role = insertUser.role || "patient";
      // Ensure specialty is set to null if not provided
      const specialty = insertUser.specialty === undefined ? null : insertUser.specialty;
      
      // Create default user settings
      const defaultSettings: UserSettings = {
        profile: {
          fullName: insertUser.fullName,
          email: insertUser.email,
          phone: insertUser.phone || null,
          specialty: specialty,
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
        },
        security: {
          twoFactorEnabled: false,
          requiredReauthForSensitive: true,
          recoveryCodesGenerated: false
        }
      };
      
      // Convert user settings to string for storage
      const userSettingsStr = userSettingsToString(defaultSettings);
      
      // Insert user with userSettings
      const [user] = await db
        .insert(users)
        .values({
          username: insertUser.username,
          password: insertUser.password,
          fullName: insertUser.fullName,
          email: insertUser.email,
          role: role,
          specialty: specialty,
          phone: insertUser.phone,
          userSettings: userSettingsStr,
          createdAt: new Date()
        })
        .returning();
        
      // Create a copy for adding virtual properties
      const parsedUser = { ...user };
      
      // Add settings property
      Object.defineProperty(parsedUser, 'settings', {
        enumerable: true,
        value: defaultSettings
      });
      
      return parsedUser as User;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    try {
      // Handle settings separately
      const { 
        settings: updatedSettings, 
        ...otherUpdates 
      } = update;
      
      // Get the current user first
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
        
      if (!currentUser) return undefined;
  
      // Prepare the database update
      let dbUpdate: any = { ...otherUpdates };
      
      // Parse current settings from the database
      const currentSettings = parseUserSettings(currentUser.userSettings);
      
      // If user settings are being updated, try to update in database
      if (updatedSettings) {
        // Merge the updated settings with current settings
        const mergedSettings = {
          ...currentSettings,
          ...updatedSettings
        };
        
        // Serialize settings for storage
        const userSettingsStr = userSettingsToString(mergedSettings);
        
        // Add userSettings to database update
        dbUpdate.userSettings = userSettingsStr;
        
        // Store the merged settings to return after update
        Object.defineProperty(currentUser, 'settings', {
          enumerable: true,
          value: mergedSettings
        });
      } else {
        // Store current settings in the user object
        Object.defineProperty(currentUser, 'settings', {
          enumerable: true,
          value: currentSettings
        });
      }
      
      // If there are database fields to update, perform the update
      if (Object.keys(dbUpdate).length > 0) {
        // Update user in database
        const [updatedUser] = await db
          .update(users)
          .set(dbUpdate)
          .where(eq(users.id, id))
          .returning();
        
        if (!updatedUser) return undefined;
        
        // Create a copy for adding virtual properties
        const parsedUser = { ...updatedUser };
        
        // Get final settings
        const finalSettings = updatedSettings 
          ? { ...currentSettings, ...updatedSettings }
          : currentSettings;
        
        // Add settings property
        Object.defineProperty(parsedUser, 'settings', {
          enumerable: true,
          value: finalSettings
        });
        
        return parsedUser as User;
      }
      
      // If no updates were made, return the current user
      return currentUser as User;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const userList = await db.select().from(users);
      
      // Process each user to have proper settings
      return userList.map(user => {
        // Create a new object with all user properties
        const parsedUser = { ...user };
        
        // Parse settings from userSettings column
        const settings = parseUserSettings(user.userSettings);
        
        // Add settings property and virtual properties derived from settings
        const enhancedUser = {
          ...parsedUser,
          settings,
          fullName: settings?.profile?.fullName,
          email: settings?.profile?.email,
          specialty: settings?.profile?.specialty,
          phone: settings?.profile?.phone
        };
        
        return enhancedUser as User;
      });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }
  
  async getDoctors(): Promise<User[]> {
    try {
      const doctorList = await db
        .select()
        .from(users)
        .where(eq(users.role, "doctor"));
        
      // Process each doctor to have proper settings
      return doctorList.map(doctor => {
        // Create a new object with all doctor properties
        const parsedDoctor = { ...doctor };
        
        // Parse settings from userSettings column
        const settings = parseUserSettings(doctor.userSettings);
        
        // Add settings property and virtual properties derived from settings
        const enhancedDoctor = {
          ...parsedDoctor,
          settings,
          fullName: settings?.profile?.fullName,
          email: settings?.profile?.email,
          specialty: settings?.profile?.specialty,
          phone: settings?.profile?.phone
        };
        
        return enhancedDoctor as User;
      });
    } catch (error) {
      console.error('Error in getDoctors:', error);
      throw error;
    }
  }

  // Record operations
  async getRecord(id: number): Promise<Record | undefined> {
    const [record] = await db
      .select()
      .from(records)
      .where(eq(records.id, id));
    return record || undefined;
  }

  async getRecordsByPatientId(patientId: number): Promise<Record[]> {
    const recordList = await db
      .select()
      .from(records)
      .where(eq(records.patientId, patientId))
      .orderBy(desc(records.recordDate));
    return recordList;
  }

  async getRecordsByDoctorId(doctorId: number): Promise<Record[]> {
    const recordList = await db
      .select()
      .from(records)
      .where(eq(records.doctorId, doctorId))
      .orderBy(desc(records.recordDate));
    return recordList;
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    try {
      const [record] = await db
        .insert(records)
        .values(insertRecord)
        .returning();
      return record;
    } catch (error) {
      console.error('Error in createRecord:', error);
      throw error;
    }
  }

  async updateRecord(id: number, update: Partial<Record>): Promise<Record | undefined> {
    try {
      const [record] = await db
        .update(records)
        .set(update)
        .where(eq(records.id, id))
        .returning();
      return record || undefined;
    } catch (error) {
      console.error('Error in updateRecord:', error);
      throw error;
    }
  }

  // Access request operations
  async getAccessRequest(id: number): Promise<AccessRequest | undefined> {
    const [request] = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, id));
    return request || undefined;
  }

  async getAccessRequestsByPatientId(patientId: number): Promise<AccessRequest[]> {
    const requestList = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.patientId, patientId))
      .orderBy(desc(accessRequests.requestDate));
    return requestList;
  }

  async getAccessRequestsByDoctorId(doctorId: number): Promise<AccessRequest[]> {
    const requestList = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.doctorId, doctorId))
      .orderBy(desc(accessRequests.requestDate));
    return requestList;
  }

  async getActiveAccessRequests(doctorId: number, patientId: number): Promise<AccessRequest[]> {
    const now = new Date();
    const requestList = await db
      .select()
      .from(accessRequests)
      .where(
        and(
          eq(accessRequests.doctorId, doctorId),
          eq(accessRequests.patientId, patientId),
          eq(accessRequests.status, 'approved')
          // We'd also check expiryDate > now, but we'll handle that in code
        )
      );
    
    // Filter out expired requests (handle in code since SQL comparison might be tricky)
    return requestList.filter(request => {
      if (!request.expiryDate) return true;
      return new Date(request.expiryDate) > now;
    });
  }

  async hasAccess(doctorId: number, patientId: number): Promise<boolean> {
    const activeRequests = await this.getActiveAccessRequests(doctorId, patientId);
    return activeRequests.length > 0;
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    try {
      // Calculate expiry date based on duration (in days)
      let expiryDate = null;
      if (insertRequest.duration) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + insertRequest.duration);
      }
      
      const [request] = await db
        .insert(accessRequests)
        .values({
          ...insertRequest,
          requestDate: new Date(),
          expiryDate
        })
        .returning();
      return request;
    } catch (error) {
      console.error('Error in createAccessRequest:', error);
      throw error;
    }
  }

  async updateAccessRequest(id: number, update: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    try {
      // Calculate new expiry date if status is being updated to approved and we have duration
      if (update.status === 'approved' && !update.expiryDate) {
        const [request] = await db
          .select()
          .from(accessRequests)
          .where(eq(accessRequests.id, id));
        
        if (request && request.duration) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + request.duration);
          update.expiryDate = expiryDate;
        }
      }
      
      const [updatedRequest] = await db
        .update(accessRequests)
        .set(update)
        .where(eq(accessRequests.id, id))
        .returning();
      return updatedRequest || undefined;
    } catch (error) {
      console.error('Error in updateAccessRequest:', error);
      throw error;
    }
  }

  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    try {
      const [log] = await db
        .insert(auditLogs)
        .values({
          ...insertLog,
          timestamp: new Date()
        })
        .returning();
      return log;
    } catch (error) {
      console.error('Error in createAuditLog:', error);
      throw error;
    }
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const logList = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp));
    return logList;
  }

  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    const logList = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp));
    return logList;
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
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    // Add settings from userSettings if it exists
    const settings = parseUserSettings(user.userSettings);
    
    // Add settings property and virtual properties derived from settings
    const enhancedUser = {
      ...user,
      settings,
      fullName: settings?.profile?.fullName,
      email: settings?.profile?.email,
      specialty: settings?.profile?.specialty,
      phone: settings?.profile?.phone
    };
    
    return enhancedUser as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.usersMap.values()) {
      if (user.username === username) {
        // Add settings from userSettings if it exists
        const settings = parseUserSettings(user.userSettings);
        
        // Add settings property and virtual properties derived from settings
        const enhancedUser = {
          ...user,
          settings,
          fullName: settings?.profile?.fullName,
          email: settings?.profile?.email,
          specialty: settings?.profile?.specialty,
          phone: settings?.profile?.phone
        };
        
        return enhancedUser as User;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.usersMap.values()) {
      if (user.email === email) {
        // Add settings from userSettings if it exists
        const settings = parseUserSettings(user.userSettings);
        
        // Add settings property and virtual properties derived from settings
        const enhancedUser = {
          ...user,
          settings,
          fullName: settings?.profile?.fullName,
          email: settings?.profile?.email,
          specialty: settings?.profile?.specialty,
          phone: settings?.profile?.phone
        };
        
        return enhancedUser as User;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const role = insertUser.role || "patient";
    const specialty = insertUser.specialty || null;
    
    // Create default user settings
    const defaultSettings: UserSettings = {
      profile: {
        fullName: insertUser.fullName,
        email: insertUser.email,
        phone: insertUser.phone || null,
        specialty: specialty,
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
      },
      security: {
        twoFactorEnabled: false,
        requiredReauthForSensitive: true,
        recoveryCodesGenerated: false
      }
    };
    
    // Convert user settings to string for storage
    const userSettingsStr = userSettingsToString(defaultSettings);
    
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      fullName: insertUser.fullName,
      email: insertUser.email,
      role,
      specialty,
      phone: insertUser.phone || null,
      createdAt: new Date(),
      userSettings: userSettingsStr,
      settings: defaultSettings,
    };
    
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const user = this.usersMap.get(id);
    if (!user) return undefined;
    
    // Extract settings update
    const { settings: updatedSettings, ...otherUpdates } = update;
    
    // Apply other updates
    Object.assign(user, otherUpdates);
    
    // Handle settings update
    if (updatedSettings) {
      // Parse current settings
      const currentSettings = parseUserSettings(user.userSettings);
      
      // Merge settings
      const mergedSettings = {
        ...currentSettings,
        ...updatedSettings
      };
      
      // Update userSettings string
      user.userSettings = userSettingsToString(mergedSettings);
      
      // Update virtual settings property
      user.settings = mergedSettings;
    }
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const users = Array.from(this.usersMap.values());
    
    // Process each user to have proper settings and virtual properties
    return users.map(user => {
      // Parse settings from userSettings column
      const settings = parseUserSettings(user.userSettings);
      
      // Add settings property and virtual properties derived from settings
      const enhancedUser = {
        ...user,
        settings,
        fullName: settings?.profile?.fullName,
        email: settings?.profile?.email,
        specialty: settings?.profile?.specialty,
        phone: settings?.profile?.phone
      };
      
      return enhancedUser as User;
    });
  }

  async getDoctors(): Promise<User[]> {
    const users = Array.from(this.usersMap.values());
    
    // Process each doctor to have proper settings and virtual properties
    return users
      .filter(user => user.role === "doctor")
      .map(doctor => {
        // Parse settings from userSettings column
        const settings = parseUserSettings(doctor.userSettings);
        
        // Add settings property and virtual properties derived from settings
        const enhancedDoctor = {
          ...doctor,
          settings,
          fullName: settings?.profile?.fullName,
          email: settings?.profile?.email,
          specialty: settings?.profile?.specialty,
          phone: settings?.profile?.phone
        };
        
        return enhancedDoctor as User;
      });
  }

  // Record operations
  async getRecord(id: number): Promise<Record | undefined> {
    return this.recordsMap.get(id);
  }

  async getRecordsByPatientId(patientId: number): Promise<Record[]> {
    const records = Array.from(this.recordsMap.values())
      .filter(record => record.patientId === patientId)
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
    return records;
  }

  async getRecordsByDoctorId(doctorId: number): Promise<Record[]> {
    const records = Array.from(this.recordsMap.values())
      .filter(record => record.doctorId === doctorId)
      .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());
    return records;
  }

  async createRecord(insertRecord: InsertRecord): Promise<Record> {
    const id = this.recordIdCounter++;
    
    const record: Record = { 
      id,
      ...insertRecord,
      createdAt: new Date(),
    };
    
    this.recordsMap.set(id, record);
    return record;
  }

  async updateRecord(id: number, update: Partial<Record>): Promise<Record | undefined> {
    const record = this.recordsMap.get(id);
    if (!record) return undefined;
    
    Object.assign(record, update);
    return record;
  }

  // Access request operations
  async getAccessRequest(id: number): Promise<AccessRequest | undefined> {
    return this.accessRequestsMap.get(id);
  }

  async getAccessRequestsByPatientId(patientId: number): Promise<AccessRequest[]> {
    const requests = Array.from(this.accessRequestsMap.values())
      .filter(request => request.patientId === patientId)
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA;
      });
    return requests;
  }

  async getAccessRequestsByDoctorId(doctorId: number): Promise<AccessRequest[]> {
    const requests = Array.from(this.accessRequestsMap.values())
      .filter(request => request.doctorId === doctorId)
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA;
      });
    return requests;
  }

  async getActiveAccessRequests(doctorId: number, patientId: number): Promise<AccessRequest[]> {
    const now = new Date();
    
    return Array.from(this.accessRequestsMap.values())
      .filter(request => 
        request.doctorId === doctorId && 
        request.patientId === patientId &&
        request.status === 'approved' &&
        (!request.expiryDate || new Date(request.expiryDate) > now)
      );
  }

  async hasAccess(doctorId: number, patientId: number): Promise<boolean> {
    const activeRequests = await this.getActiveAccessRequests(doctorId, patientId);
    return activeRequests.length > 0;
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const id = this.accessRequestIdCounter++;
    
    // Calculate expiry date based on duration (in days)
    let expiryDate = null;
    if (insertRequest.duration) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + insertRequest.duration);
    }
    
    const request: AccessRequest = { 
      id,
      ...insertRequest,
      requestDate: new Date(),
      expiryDate,
    };
    
    this.accessRequestsMap.set(id, request);
    return request;
  }

  async updateAccessRequest(id: number, update: Partial<AccessRequest>): Promise<AccessRequest | undefined> {
    const request = this.accessRequestsMap.get(id);
    if (!request) return undefined;
    
    // Calculate new expiry date if status is being updated to approved and we have duration
    if (update.status === 'approved' && !update.expiryDate && request.duration) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + request.duration);
      update.expiryDate = expiryDate;
    }
    
    Object.assign(request, update);
    return request;
  }

  // Audit log operations
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.auditLogIdCounter++;
    
    const log: AuditLog = { 
      id,
      ...insertLog,
      timestamp: new Date(),
    };
    
    this.auditLogsMap.set(id, log);
    return log;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getAuditLogsByUserId(userId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogsMap.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// Use DatabaseStorage for production
export const storage = new DatabaseStorage();