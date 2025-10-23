const { createClient } = require('@
cat > api/check-users.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Get table structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({ error: error.message });
    }

    // Get all users to see what exists
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, credits, created_at');

    return res.json({ 
      tableSample: data?.[0],
      allUsers: allUsers || [],
      usersError: usersError?.message
    });
  } catch (error) {
    return res.json({ error: error.message });
  }
};
