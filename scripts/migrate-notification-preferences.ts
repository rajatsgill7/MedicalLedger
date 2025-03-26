import { db } from "../server/db";
import { users } from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import { pool } from "../server/db";

async function migrateNotificationPreferences() {
  console.log("Starting notification preferences migration...");
  
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users to process`);
    
    // Process each user
    for (const user of allUsers) {
      console.log(`Processing user ${user.username} (ID: ${user.id})`);
      
      // Execute a direct query to see if there's a notificationPreferences column
      const hasNotificationPrefs = await db.execute(
        sql`SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'notification_preferences'`
      );
      
      if (hasNotificationPrefs.rowCount === 0) {
        console.log(`No notification_preferences column exists in users table`);
        // Update user's settings with default notification preferences if they don't have any
        await updateUserSettings(user);
        continue;
      }
      
      // Direct query to get notificationPreferences from the database
      const result = await db.execute(
        sql`SELECT notification_preferences FROM users WHERE id = ${user.id}`
      );
      
      const notificationPrefs = result.rows[0]?.notification_preferences;
      
      if (!notificationPrefs) {
        console.log(`User ${user.id} has no notification_preferences in the database`);
        // Update user's settings with default notification preferences if they don't have any
        await updateUserSettings(user);
        continue;
      }
      
      // Parse existing notificationPreferences
      let notifications = {};
      try {
        if (typeof notificationPrefs === 'string') {
          notifications = JSON.parse(notificationPrefs);
        } else {
          notifications = notificationPrefs;
        }
        console.log(`Found notification preferences for user ${user.id}:`, notifications);
      } catch (e) {
        console.error(`Error parsing notificationPreferences for user ${user.id}:`, e);
        // Update user's settings with default notification preferences if parsing failed
        await updateUserSettings(user);
        continue;
      }
      
      // Get existing userSettings
      let userSettings = {};
      try {
        if (user.userSettings) {
          if (typeof user.userSettings === 'string') {
            userSettings = JSON.parse(user.userSettings);
          } else {
            userSettings = user.userSettings;
          }
        }
      } catch (e) {
        console.error(`Error parsing userSettings for user ${user.id}:`, e);
      }
      
      // Merge with existing settings.notifications or create new structure
      const mergedSettings = {
        ...userSettings,
        notifications: {
          ...(userSettings.notifications || {}),
          emailNotifications: notifications.emailNotifications ?? true,
          smsNotifications: notifications.smsNotifications ?? false,
          accessRequestAlerts: notifications.accessRequestAlerts ?? true,
          securityAlerts: notifications.securityAlerts ?? true
        }
      };
      
      console.log(`New settings for user ${user.id}:`, JSON.stringify(mergedSettings, null, 2));
      
      // Update the user with merged settings 
      await db.update(users)
        .set({ 
          userSettings: mergedSettings
        })
        .where(eq(users.id, user.id));
      
      console.log(`Updated user ${user.id}`);
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database pool
    await pool.end();
  }
}

async function updateUserSettings(user) {
  // Get existing userSettings
  let userSettings = {};
  try {
    if (user.userSettings) {
      if (typeof user.userSettings === 'string') {
        userSettings = JSON.parse(user.userSettings);
      } else {
        userSettings = user.userSettings;
      }
    }
  } catch (e) {
    console.error(`Error parsing userSettings for user ${user.id}:`, e);
  }
  
  // Add default notifications if they don't exist
  if (!userSettings.notifications) {
    const updatedSettings = {
      ...userSettings,
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
    
    console.log(`Adding default notification settings for user ${user.id}`);
    
    // Update the user with the new settings
    await db.update(users)
      .set({ 
        userSettings: updatedSettings
      })
      .where(eq(users.id, user.id));
    
    console.log(`Updated user ${user.id} with default notification settings`);
  } else {
    console.log(`User ${user.id} already has notification settings`);
  }
}

migrateNotificationPreferences();