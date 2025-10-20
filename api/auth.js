const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, email, password } = req.body;

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Create user record
      const { error: dbError } = await supabase
        .from('users')
        .insert([{ 
          id: data.user.id, 
          email: email,
          credits: 10 
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
      }

      return res.json({ 
        success: true, 
        userId: data.user.id,
        credits: 10
      });
    } 
    else if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Get user credits
      const { data: userData } = await supabase
        .from('users')
        .select('credits')
        .eq('id', data.user.id)
        .single();

      return res.json({ 
        success: true, 
        userId: data.user.id,
        credits: userData?.credits || 10
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
