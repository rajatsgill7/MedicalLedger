import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { z } from "zod";
import { 
  insertRecordSchema, 
  insertAccessRequestSchema, 
  UserRole,
  notificationPrefsToString,
  parseNotificationPrefs,
  userSettingsToString,
  parseUserSettings,
  SecuritySettings
} from "@shared/schema";

// Type guard to ensure req.user is defined
// This helps TypeScript understand that req.user is not undefined after calling this function
function ensureAuthenticated(req: Request): asserts req is Request & { user: Express.User } {
  if (!req.isAuthenticated() || !req.user) {
    throw new Error("User is not authenticated");
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check user role
const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    try {
      ensureAuthenticated(req);
      
      if (roles.includes(req.user.role)) {
        return next();
      }
      
      res.status(403).json({ message: "Forbidden" });
    } catch (e) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);
  
  // Users routes
  app.get('/api/users', isAuthenticated, hasRole(["admin"]), async (req, res) => {
    const users = await storage.getAllUsers();
    // Don't send passwords to client
    const sanitizedUsers = users.map(({ password, ...user }) => user);
    res.json(sanitizedUsers);
  });
  
  // Get user by ID
  app.get('/api/users/:userId', isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      ensureAuthenticated(req);
      const user = req.user;
    
      // Users can only access their own data unless they're a doctor accessing patient data 
      // or an admin who can access any user data
      if (
        userId !== user.id && 
        !((user.role as string) === 'doctor' && await storage.hasAccess(user.id, userId)) &&
        user.role !== 'admin'
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userData = await storage.getUser(userId);
      if (!userData) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from the response
      const { password, ...userWithoutPassword } = userData;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/doctors', isAuthenticated, async (req, res) => {
    const doctors = await storage.getDoctors();
    // Don't send passwords to client
    const sanitizedDoctors = doctors.map(({ password, ...doctor }) => doctor);
    res.json(sanitizedDoctors);
  });
  
  app.get('/api/patients', isAuthenticated, hasRole(["doctor", "admin"]), async (req, res) => {
    // Get all users with role "patient"
    const users = await storage.getAllUsers();
    const patients = users.filter(user => (user.role as string) === 'patient');
    
    // Don't send passwords to client
    const sanitizedPatients = patients.map(({ password, ...patient }) => patient);
    res.json(sanitizedPatients);
  });
  
  // Medical records routes
  app.get('/api/records/:id', isAuthenticated, async (req, res) => {
    const recordId = parseInt(req.params.id);
    if (isNaN(recordId)) {
      return res.status(400).json({ message: "Invalid record ID" });
    }
    
    const record = await storage.getRecord(recordId);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    
    // Ensure user is authenticated using type guard
    ensureAuthenticated(req);
    
    // Check if user has access to this record
    if (
      (req.user.role as string) === "patient" && record.patientId !== req.user.id ||
      (req.user.role as string) === "doctor" && record.patientId !== req.user.id && 
      !(await storage.hasAccess(req.user.id, record.patientId))
    ) {
      return res.status(403).json({ message: "Access denied to this record" });
    }
    
    // Log the record access
    if ((req.user.role as string) === "doctor" && record.patientId !== req.user.id) {
      await storage.createAuditLog({
        userId: req.user.id,
        action: "record_accessed",
        details: `Doctor accessed record ${recordId} of patient ${record.patientId}`,
        ipAddress: req.ip
      });
    }
    
    res.json(record);
  });
  
  // Download a medical record
  app.get('/api/records/:id/download', isAuthenticated, async (req, res) => {
    const recordId = parseInt(req.params.id);
    if (isNaN(recordId)) {
      return res.status(400).json({ message: "Invalid record ID" });
    }
    
    const record = await storage.getRecord(recordId);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    
    // Ensure user is authenticated using type guard
    ensureAuthenticated(req);
    
    // Check if user has access to this record
    if (
      (req.user.role as string) === "patient" && record.patientId !== req.user.id ||
      (req.user.role as string) === "doctor" && record.patientId !== req.user.id && 
      !(await storage.hasAccess(req.user.id, record.patientId))
    ) {
      return res.status(403).json({ message: "Access denied to this record" });
    }
    
    // Log the record download
    await storage.createAuditLog({
      userId: req.user.id,
      action: "record_downloaded",
      details: `User downloaded record ${recordId}`,
      ipAddress: req.ip
    });
    
    // In a real application, this would stream the file for download
    // For this demo, we'll generate a simple text file with the record data
    const recordData = `
Medical Record: ${record.title}
Date: ${record.recordDate}
Type: ${record.recordType}
Doctor: ${record.doctorName || "Not specified"}
Patient ID: ${record.patientId}
Notes: ${record.notes || "None"}
Verified: ${record.verified ? "Yes" : "No"}
    `;
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="medical-record-${recordId}.txt"`);
    
    // Send the file data
    res.send(recordData);
  });
  
  app.get('/api/patients/:patientId/records', isAuthenticated, async (req, res) => {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    
    // Use type guard to ensure req.user is defined
    ensureAuthenticated(req);
    const user = req.user;
    
    // Check if user has access to patient records
    if (
      (user.role as string) === "patient" && patientId !== user.id ||
      (user.role as string) === "doctor" && patientId !== user.id && 
      !(await storage.hasAccess(user.id, patientId))
    ) {
      return res.status(403).json({ message: "Access denied to patient records" });
    }
    
    const records = await storage.getRecordsByPatientId(patientId);
    
    // Log the records access if it's a doctor accessing patient records
    if ((user.role as string) === "doctor" && patientId !== user.id) {
      await storage.createAuditLog({
        userId: user.id,
        action: "records_accessed",
        details: `Doctor accessed records of patient ${patientId}`,
        ipAddress: req.ip
      });
    }
    
    res.json(records);
  });
  
  // Get all records for a doctor (across all patients they have access to)
  app.get('/api/records/doctor/:doctorId', isAuthenticated, hasRole(["doctor"]), async (req, res) => {
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }
    
    // Use type guard to ensure req.user is defined
    ensureAuthenticated(req);
    const user = req.user;
    
    // Doctors can only view their own accessible records
    if (doctorId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    // Get all active access requests for this doctor
    const accessRequests = await storage.getAccessRequestsByDoctorId(doctorId);
    const activeRequests = accessRequests.filter(req => req.status === "approved");
    
    // Get all records for patients the doctor has access to
    const allRecords = [];
    
    // Add the doctor's own records if they are also a patient
    if ((user.role as string) === "doctor") {
      const ownRecords = await storage.getRecordsByPatientId(doctorId);
      allRecords.push(...ownRecords);
    }
    
    // Get records for each patient the doctor has access to
    for (const request of activeRequests) {
      const patientRecords = await storage.getRecordsByPatientId(request.patientId);
      // For each record, add doctor access info as additional non-DB properties
      patientRecords.forEach(record => {
        // Use type assertion to add the properties that don't exist in the record schema
        // but are needed for the frontend to display access status
        (record as any).accessGranted = true;
        (record as any).accessExpiryDate = request.expiryDate;
      });
      allRecords.push(...patientRecords);
    }
    
    // Log this access
    await storage.createAuditLog({
      userId: user.id,
      action: "records_viewed",
      details: `Doctor viewed their accessible patient records`,
      ipAddress: req.ip
    });
    
    res.json(allRecords);
  });

  app.post('/api/records', isAuthenticated, async (req, res) => {
    try {
      const recordData = insertRecordSchema.parse(req.body);
      
      // Use type guard to ensure req.user is defined
      ensureAuthenticated(req);
      const user = req.user;
      
      // Verify access rights
      if (
        (user.role as string) === "patient" && recordData.patientId !== user.id ||
        (user.role as string) === "doctor" && 
        recordData.patientId !== user.id && 
        !(await storage.hasAccess(user.id, recordData.patientId))
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Auto-verify if doctor is uploading
      const verified = (user.role as string) === "doctor";
      
      const record = await storage.createRecord({
        ...recordData,
        verified
      });
      
      // Log the record creation
      await storage.createAuditLog({
        userId: user.id,
        action: "record_created",
        details: `${user.role} created record ${record.id} for patient ${record.patientId}`,
        ipAddress: req.ip
      });
      
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid record data", 
          errors: (error as unknown as { errors: any }).errors 
        });
      }
      throw error;
    }
  });
  
  // Access request routes
  app.get('/api/access-requests/patient/:patientId', isAuthenticated, async (req, res) => {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }
    
    // Use type guard to ensure req.user is defined
    ensureAuthenticated(req);
    const user = req.user;
    
    // Patients can only view their own access requests
    if ((user.role as string) === "patient" && patientId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const requests = await storage.getAccessRequestsByPatientId(patientId);
    
    // For each request, fetch the doctor's information
    const requestsWithDoctor = await Promise.all(requests.map(async (request) => {
      const doctor = await storage.getUser(request.doctorId);
      return {
        ...request,
        doctor: doctor ? {
          id: doctor.id,
          fullName: doctor.fullName,
          specialty: doctor.specialty,
          email: doctor.email
        } : null
      };
    }));
    
    res.json(requestsWithDoctor);
  });
  
  app.get('/api/access-requests/doctor/:doctorId', isAuthenticated, async (req, res) => {
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }
    
    // Use type guard to ensure req.user is defined
    ensureAuthenticated(req);
    const user = req.user;
    
    // Doctors can only view their own access requests
    if ((user.role as string) === "doctor" && doctorId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const requests = await storage.getAccessRequestsByDoctorId(doctorId);
    
    // For each request, fetch the patient's information and record count
    const requestsWithPatient = await Promise.all(requests.map(async (request) => {
      const patient = await storage.getUser(request.patientId);
      // Get the patient's records count
      const records = patient ? await storage.getRecordsByPatientId(patient.id) : [];
      const recordCount = records.length;
      
      return {
        ...request,
        patient: patient ? {
          id: patient.id,
          fullName: patient.fullName,
          email: patient.email,
          recordCount
        } : null
      };
    }));
    
    res.json(requestsWithPatient);
  });
  
  app.post('/api/access-requests', isAuthenticated, hasRole(["doctor"]), async (req, res) => {
    try {
      const requestData = insertAccessRequestSchema.parse(req.body);
      
      // Use type guard to ensure req.user is defined
      ensureAuthenticated(req);
      const user = req.user;
      
      // Only doctors can create access requests
      if ((user.role as string) !== 'doctor') {
        return res.status(403).json({ message: "Only doctors can request access" });
      }
      
      // Ensure doctor is requesting for themselves
      if (requestData.doctorId !== user.id) {
        return res.status(403).json({ message: "Cannot request access on behalf of another doctor" });
      }
      
      // Check if patient exists
      const patient = await storage.getUser(requestData.patientId);
      if (!patient || (patient.role as string) !== 'patient') {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      // Create access request
      const accessRequest = await storage.createAccessRequest(requestData);
      
      // Log the access request
      await storage.createAuditLog({
        userId: user.id,
        action: "access_requested",
        details: `Doctor requested access to patient ${requestData.patientId} records for ${requestData.duration} days`,
        ipAddress: req.ip
      });
      
      res.status(201).json(accessRequest);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid access request data", 
          errors: (error as unknown as { errors: any }).errors 
        });
      }
      throw error;
    }
  });
  
  app.patch('/api/access-requests/:id', isAuthenticated, async (req, res) => {
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
      return res.status(400).json({ message: "Invalid request ID" });
    }
    
    const accessRequest = await storage.getAccessRequest(requestId);
    if (!accessRequest) {
      return res.status(404).json({ message: "Access request not found" });
    }
    
    // Use type guard to ensure req.user is defined
    ensureAuthenticated(req);
    const user = req.user;
    
    // Verify permissions: patient can only update their own requests,
    // doctor can only update requests they made, admin can update any
    if (
      ((user.role as string) === 'patient' && accessRequest.patientId !== user.id) ||
      ((user.role as string) === 'doctor' && accessRequest.doctorId !== user.id)
    ) {
      // Admin role is excluded from this check (admins can update any)
      if (user.role as string !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
    }
    
    // Update access request
    const updatedRequest = await storage.updateAccessRequest(requestId, req.body);
    if (!updatedRequest) {
      return res.status(404).json({ message: "Access request not found" });
    }
    
    // Log the action
    const action = req.body.status === "approved" 
      ? "access_approved" 
      : req.body.status === "denied" 
        ? "access_denied" 
        : req.body.status === "revoked"
          ? "access_revoked"
          : "access_updated";
        
    await storage.createAuditLog({
      userId: user.id,
      action,
      details: `${user.role} ${action.replace('_', ' ')} for doctor ${accessRequest.doctorId} to patient ${accessRequest.patientId}`,
      ipAddress: req.ip
    });
    
    res.json(updatedRequest);
  });
  
  // Audit logs routes
  app.get('/api/audit-logs', isAuthenticated, hasRole(["admin"]), async (req, res) => {
    const logs = await storage.getAuditLogs();
    
    // Fetch user information for each log
    const logsWithUser = await Promise.all(logs.map(async (log) => {
      const user = await storage.getUser(log.userId);
      return {
        ...log,
        user: user ? {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        } : null
      };
    }));
    
    res.json(logsWithUser);
  });
  
  app.get('/api/audit-logs/user/:userId', isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Use type guard to ensure req.user is defined
    ensureAuthenticated(req);
    const user = req.user;
    
    // Users can only view their own logs, admins can view any
    if ((user.role as string) !== 'admin' && userId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const logs = await storage.getAuditLogsByUserId(userId);
    res.json(logs);
  });

  // User profile and settings routes
  app.patch('/api/users/:id', isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      ensureAuthenticated(req);
      const user = req.user;
      
      // Users can only update their own profile, admins can update any
      if ((user.role as string) !== 'admin' && userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
  
      // Validate profile data using zod
      const profileSchema = z.object({
        fullName: z.string().min(3).optional(),
        email: z.string().email().optional(),
        specialty: z.string().optional(),
        phone: z.string().optional(),
      });
  
      const validatedData = profileSchema.parse(req.body);
      
      // Debug log to see what's coming in
      console.log('Profile update request:', req.body);
      console.log('Validated data:', validatedData);
      
      // Update user
      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Debug log to see what's returned after update
      console.log('Updated user:', updatedUser);

      // Log the update
      await storage.createAuditLog({
        userId: user.id,
        action: "profile_updated",
        details: `User updated profile information`,
        ipAddress: req.ip
      });

      // Don't send password to client
      const { password, ...sanitizedUser } = updatedUser;
      console.log('Sending to client:', sanitizedUser);
      res.json(sanitizedUser);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: (error as unknown as { errors: any }).errors 
        });
      }
      throw error;
    }
  });

  app.post('/api/users/:id/change-password', isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      ensureAuthenticated(req);
      const user = req.user;
      
      // Users can only change their own password, admins can force change
      if ((user.role as string) !== 'admin' && userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
  
      const { currentPassword, newPassword } = req.body;
  
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
  
      // For regular users, verify current password
      if (userId === user.id && (user.role as string) !== 'admin') {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
  
        const userToUpdate = await storage.getUser(userId);
        if (!userToUpdate) {
          return res.status(404).json({ message: "User not found" });
        }
  
        const passwordValid = await comparePasswords(currentPassword, userToUpdate.password);
        if (!passwordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }
  
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Log the update
      await storage.createAuditLog({
        userId: user.id,
        action: "password_changed",
        details: userId === user.id 
          ? `User changed their password` 
          : `Admin changed password for user ${userId}`,
        ipAddress: req.ip
      });
  
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof Error && error.message === "User is not authenticated") {
        return res.status(401).json({ message: "Unauthorized" });
      }
      throw error;
    }
  });

  app.patch('/api/users/:id/notifications', isAuthenticated, async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      ensureAuthenticated(req);
      const user = req.user;
      
      // Users can only update their own notifications
      if (userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
  
      const notificationSchema = z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        accessRequestAlerts: z.boolean().optional(),
        securityAlerts: z.boolean().optional(),
      });
  
      const validatedData = notificationSchema.parse(req.body);
      console.log('Notification update received:', validatedData);
      
      // Get the current user to retrieve existing notification preferences
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user with validated notification preferences
      // Use the imported helper function to properly serialize the preferences
      const updatedUser = await storage.updateUser(userId, { 
        notificationPreferences: notificationPrefsToString(validatedData)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log the update
      await storage.createAuditLog({
        userId: user.id,
        action: "notification_preferences_updated",
        details: `User updated notification preferences`,
        ipAddress: req.ip
      });

      // Parse the saved preferences before returning to client
      const preferences = parseNotificationPrefs(updatedUser.notificationPreferences);
      console.log('Updated notification preferences:', preferences);

      res.json({
        message: "Notification preferences updated",
        preferences
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Invalid notification data", 
          errors: (error as unknown as { errors: any }).errors 
        });
      }
      throw error;
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
