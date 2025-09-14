const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const connectDB = async () => {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Test the connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is expected for new projects
      throw error;
    }

    console.log('Supabase Connected Successfully');
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call connectDB first.');
  }
  return supabase;
};

module.exports = { connectDB, getSupabase };