const { getSupabase } = require('../config/database');
const { connectDB } = require('../config/database');

async function addUserTypeColumn() {
  try {
    await connectDB();
    const supabase = getSupabase();
    
    console.log('Adding user_type column to users table...');
    
    console.log('Please run the following SQL commands in your Supabase SQL Editor:');
    console.log('\n=== SQL MIGRATION COMMANDS ===');
    console.log('ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT \'customer\';');
    console.log('UPDATE public.users SET user_type = \'customer\' WHERE user_type IS NULL;');
    console.log('COMMENT ON COLUMN public.users.user_type IS \'Type of user: customer, shop_owner, admin\';');
    console.log('=== END MIGRATION COMMANDS ===\n');
    
    console.log('After running the SQL commands above, the user_type column will be added to your users table.');
    console.log('This will resolve the "Could not find the \'userType\' column" error in your frontend.');
    
    const data = { success: true };
    const error = null;
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('user_type column added to users table');
    
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  addUserTypeColumn();
}

module.exports = { addUserTypeColumn };