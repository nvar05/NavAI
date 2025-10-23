const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Set CORS headers
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
    let body = '';
    req.on('data', chunk => body += chunk);
    
    await new Promise((resolve) => {
      req.on('end', resolve);
    });

    const { action, email, password } = JSON.parse(body);
    
    if (!action || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('Auth request:', action, email);

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Create user record WITHOUT password field (it's in auth.users)
      const { error: dbError } = await supabase
        .from('users')
        .insert([{ 
          id: data.user.id, 
          email: email,
          credits: 10 
          // Don't include password - it's handled by Supabase Auth
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        // If user creation fails, still return success but log the error
        // This allows users to continue even if the users table has issues
      }

      return res.json({ 
        success: true, 
        userId: data.user.id,
        credits: 10
      });
      
    } else if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Get user credits - create user if doesn't exist
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('User lookup error:', userError);
        // Create user if doesn't exist
        const { error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: data.user.id, 
            email: email,
            credits: 10 
          }]);
        
        if (createError) {
          console.error('User creation error:', createError);
        }
        
        return res.json({ 
          success: true, 
          userId: data.user.id,
          credits: 10
        });
      }

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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
