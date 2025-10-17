const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL present:', !!supabaseUrl);
console.log('Key present:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test by trying to count users
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase error:', error.message);
      console.log('💡 Make sure your users table exists with the correct columns');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Total users in database:', count);
    }
  } catch (err) {
    console.log('❌ Connection test failed:', err.message);
  }
}

testConnection();
