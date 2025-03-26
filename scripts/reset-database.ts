import { db } from "../server/db";
import { users, records, accessRequests, auditLogs, UserRole } from "../shared/schema";
import { hashPassword } from "../server/auth";
import { userSettingsToString } from "../shared/schema";

async function resetDatabase() {
  try {
    console.log("Starting database reset...");
    
    // Clear all tables
    console.log("Deleting data from all tables...");
    await db.delete(auditLogs);
    await db.delete(accessRequests);
    await db.delete(records);
    await db.delete(users);
    
    console.log("All tables cleared successfully");
    
    // Insert admin user
    const adminPassword = await hashPassword("admin123");
    const admin = await db.insert(users).values({
      username: "admin",
      password: adminPassword,
      fullName: "System Administrator",
      email: "admin@medivault.com",
      role: UserRole.ADMIN,
      phone: "5551234567",
      specialty: null,
      notificationPreferences: JSON.stringify({
        emailNotifications: true,
        smsNotifications: true,
        accessRequestAlerts: true,
        securityAlerts: true
      }),
      userSettings: userSettingsToString({
        profile: {
          fullName: "System Administrator",
          email: "admin@medivault.com",
          phone: "5551234567"
        },
        security: {
          twoFactorEnabled: false,
          requiredReauthForSensitive: true,
          recoveryCodesGenerated: false
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          accessRequestAlerts: true,
          securityAlerts: true,
          newRecordAlerts: true,
          systemUpdates: true,
          marketingEmails: false,
          communicationPreference: "email",
          quietHours: {
            enabled: false
          }
        }
      })
    }).returning();
    console.log("Admin user created:", admin[0].username);
    
    // Insert doctor users
    const doctorPassword = await hashPassword("doctor123");
    
    const doctor1 = await db.insert(users).values({
      username: "dr.smith",
      password: doctorPassword,
      fullName: "Dr. John Smith",
      email: "dr.smith@medivault.com",
      role: UserRole.DOCTOR,
      phone: "5552345678",
      specialty: "Cardiology",
      notificationPreferences: JSON.stringify({
        emailNotifications: true,
        smsNotifications: true,
        accessRequestAlerts: true,
        securityAlerts: true
      }),
      userSettings: userSettingsToString({
        profile: {
          fullName: "Dr. John Smith",
          email: "dr.smith@medivault.com",
          phone: "5552345678",
          specialty: "Cardiology"
        },
        security: {
          twoFactorEnabled: false,
          requiredReauthForSensitive: true,
          recoveryCodesGenerated: false
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          accessRequestAlerts: true,
          securityAlerts: true,
          newRecordAlerts: true,
          systemUpdates: true,
          marketingEmails: false,
          communicationPreference: "email",
          quietHours: {
            enabled: false
          }
        }
      })
    }).returning();
    console.log("Doctor user created:", doctor1[0].username);
    
    const doctor2 = await db.insert(users).values({
      username: "dr.patel",
      password: doctorPassword,
      fullName: "Dr. Priya Patel",
      email: "dr.patel@medivault.com",
      role: UserRole.DOCTOR,
      phone: "5553456789",
      specialty: "Neurology",
      notificationPreferences: JSON.stringify({
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      }),
      userSettings: userSettingsToString({
        profile: {
          fullName: "Dr. Priya Patel",
          email: "dr.patel@medivault.com",
          phone: "5553456789",
          specialty: "Neurology"
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
          communicationPreference: "email",
          quietHours: {
            enabled: false
          }
        }
      })
    }).returning();
    console.log("Doctor user created:", doctor2[0].username);
    
    // Insert patient users
    const patientPassword = await hashPassword("patient123");
    
    const patient1 = await db.insert(users).values({
      username: "patient1",
      password: patientPassword,
      fullName: "Sarah Johnson",
      email: "sarah.j@example.com",
      role: UserRole.PATIENT,
      phone: "5554567890",
      specialty: null,
      notificationPreferences: JSON.stringify({
        emailNotifications: true,
        smsNotifications: true,
        accessRequestAlerts: true,
        securityAlerts: true
      }),
      userSettings: userSettingsToString({
        profile: {
          fullName: "Sarah Johnson",
          email: "sarah.j@example.com",
          phone: "5554567890",
          dateOfBirth: "1985-03-15"
        },
        security: {
          twoFactorEnabled: false,
          requiredReauthForSensitive: true,
          recoveryCodesGenerated: false
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          accessRequestAlerts: true,
          securityAlerts: true,
          newRecordAlerts: true,
          systemUpdates: false,
          marketingEmails: false,
          communicationPreference: "email",
          quietHours: {
            enabled: false
          }
        }
      })
    }).returning();
    console.log("Patient user created:", patient1[0].username);
    
    const patient2 = await db.insert(users).values({
      username: "patient2",
      password: patientPassword,
      fullName: "Michael Chen",
      email: "michael.c@example.com",
      role: UserRole.PATIENT,
      phone: "5555678901",
      specialty: null,
      notificationPreferences: JSON.stringify({
        emailNotifications: true,
        smsNotifications: false,
        accessRequestAlerts: true,
        securityAlerts: true
      }),
      userSettings: userSettingsToString({
        profile: {
          fullName: "Michael Chen",
          email: "michael.c@example.com",
          phone: "5555678901",
          dateOfBirth: "1990-07-22"
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
          systemUpdates: false,
          marketingEmails: false,
          communicationPreference: "email",
          quietHours: {
            enabled: false
          }
        }
      })
    }).returning();
    console.log("Patient user created:", patient2[0].username);

    // Create some sample medical records
    await db.insert(records).values({
      patientId: patient1[0].id,
      title: "Annual Physical Examination",
      recordType: "Examination",
      recordDate: "2023-06-15",
      doctorName: doctor1[0].fullName,
      notes: "Patient is in good health. Blood pressure: 120/80. Heart rate: 75 bpm.",
      verified: true
    });
    
    await db.insert(records).values({
      patientId: patient1[0].id,
      title: "Blood Test Results",
      recordType: "Lab Results",
      recordDate: "2023-06-20",
      doctorName: doctor1[0].fullName,
      notes: "All results within normal range. Cholesterol: 180 mg/dL.",
      verified: true
    });
    
    await db.insert(records).values({
      patientId: patient2[0].id,
      title: "Neurological Assessment",
      recordType: "Examination",
      recordDate: "2023-07-10",
      doctorName: doctor2[0].fullName,
      notes: "Patient reports occasional headaches. No other neurological symptoms observed.",
      verified: true
    });
    
    // Create sample access requests
    await db.insert(accessRequests).values({
      doctorId: doctor1[0].id,
      patientId: patient2[0].id,
      purpose: "Consultation for heart condition",
      duration: 30, // days
      notes: "Need to review patient's medical history for ongoing heart condition.",
      status: "pending",
      requestDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      limitedScope: false
    });
    
    await db.insert(accessRequests).values({
      doctorId: doctor2[0].id,
      patientId: patient1[0].id,
      purpose: "Neurological follow-up",
      duration: 60, // days
      notes: "Need to monitor patient's neurological condition over the next two months.",
      status: "approved",
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      expiryDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000), // 55 more days
      limitedScope: false
    });
    
    // Create some audit logs
    await db.insert(auditLogs).values({
      userId: doctor1[0].id,
      action: "login",
      details: "User logged in successfully",
      ipAddress: "192.168.1.1",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    
    await db.insert(auditLogs).values({
      userId: doctor2[0].id,
      action: "record_accessed",
      details: `Doctor accessed record of patient ${patient1[0].id}`,
      ipAddress: "192.168.1.2",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });
    
    await db.insert(auditLogs).values({
      userId: admin[0].id,
      action: "system_settings_updated",
      details: "Admin updated system settings",
      ipAddress: "192.168.1.3",
      timestamp: new Date()
    });
    
    console.log("Database reset completed successfully!");
    console.log("\nLogin Credentials:");
    console.log("------------------");
    console.log("Admin User:");
    console.log("  Username: admin");
    console.log("  Password: admin123");
    console.log("\nDoctor Users:");
    console.log("  Username: dr.smith");
    console.log("  Password: doctor123");
    console.log("  Username: dr.patel");
    console.log("  Password: doctor123");
    console.log("\nPatient Users:");
    console.log("  Username: patient1");
    console.log("  Password: patient123");
    console.log("  Username: patient2");
    console.log("  Password: patient123");

  } catch (error) {
    console.error("Error resetting database:", error);
  } finally {
    process.exit(0);
  }
}

resetDatabase();