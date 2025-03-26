import { pool } from "../server/db";
import { jsonb } from "drizzle-orm/pg-core";
import { User, parseNotificationPrefs, userSettingsToString } from "../shared/schema";

async function updateUsersTable() {
  console.log("Starting database migration to add user_settings column...");
  
  // Connect to the database
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Check if the column already exists
      const checkColumnQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'user_settings';
      `;
      
      const columnExists = await client.query(checkColumnQuery);
      
      if (columnExists.rowCount === 0) {
        console.log("Column 'user_settings' doesn't exist. Adding it now...");
        
        // Add user_settings column
        await client.query(`
          ALTER TABLE users
          ADD COLUMN user_settings JSONB;
        `);
        
        console.log("Column 'user_settings' added successfully.");
        
        // Get all users
        const { rows: users } = await client.query('SELECT * FROM users');
        
        console.log(`Migrating data for ${users.length} users...`);
        
        // For each user, create initial settings based on existing data
        for (const user of users) {
          // Parse existing notification preferences
          const notificationPrefs = parseNotificationPrefs(user.notification_preferences);
          
          // Create default settings object
          const settings = {
            profile: {
              fullName: user.full_name,
              email: user.email,
              phone: user.phone,
              specialty: user.specialty,
            },
            notifications: {
              ...notificationPrefs,
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
          
          // Convert to string for storage
          const settingsStr = userSettingsToString(settings);
          
          // Update the user with the settings
          await client.query(
            'UPDATE users SET user_settings = $1 WHERE id = $2',
            [settingsStr, user.id]
          );
        }
        
        console.log("User settings data migrated successfully.");
      } else {
        console.log("Column 'user_settings' already exists. No changes needed.");
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log("Database migration completed successfully!");
      
    } catch (err) {
      // Rollback the transaction in case of error
      await client.query('ROLLBACK');
      console.error("Error during migration:", err);
      throw err;
    }
    
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the migration
updateUsersTable()
  .then(() => {
    console.log("Migration script finished");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });