// Check current credit tracking
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  try {
    // Get all users with their credits
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, credits, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      totalUsers: users?.length || 0,
      users: users || [],
      message: users?.length ? 'Users found' : 'No users in database'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
