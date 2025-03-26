import { pool } from '../server/db';

/**
 * Script to drop the notification_preferences column from the users table
 * after ensuring all data has been migrated to user_settings
 */
async function dropNotificationPreferencesColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Starting to drop notification_preferences column...');
    
    // Begin transaction
    await client.query('BEGIN');

    // First check if the column exists
    const checkColumnExists = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'notification_preferences';
    `);
    
    if (checkColumnExists.rows.length === 0) {
      console.log('Column notification_preferences already does not exist. No action needed.');
      return;
    }
    
    // Check if we have user_settings for all users to ensure no data loss
    const checkUsersWithoutSettings = await client.query(`
      SELECT id, username
      FROM users
      WHERE user_settings IS NULL OR user_settings::text = '{}';
    `);
    
    if (checkUsersWithoutSettings.rows.length > 0) {
      console.error('The following users do not have user_settings data:');
      console.error(checkUsersWithoutSettings.rows);
      throw new Error('Cannot drop notification_preferences column as some users would lose data. Please migrate all data first.');
    }
    
    // Drop the column
    console.log('Dropping notification_preferences column...');
    await client.query(`
      ALTER TABLE users
      DROP COLUMN notification_preferences;
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Successfully dropped notification_preferences column from users table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error dropping notification_preferences column:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Execute the function
dropNotificationPreferencesColumn()
  .then(() => {
    console.log('Completed notification_preferences column drop');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to drop notification_preferences column:', error);
    process.exit(1);
  });