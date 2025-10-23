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
    
    if (!action || !email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log('Auth request:', action, email);

    if (action === 'signup') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required for signup' });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://nav-ai.co.uk/verify.html' // Fixed URL
        }
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Create user record (will be used after email verification)
      if (data.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([{ 
            id: data.user.id, 
            email: email,
            credits: 10,
            verified: false // Mark as unverified until email confirmation
          }]);

        if (dbError) {
          console.error('Database error:', dbError);
        }
      }

      return res.json({ 
        success: true, 
        message: 'Check your email for verification link',
        needsVerification: true
      });
      
    } else if (action === 'login') {
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required for login' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Check if user is verified
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits, verified')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return res.status(400).json({ success: false, message: 'User not found' });
      }

      if (!userData.verified) {
        return res.status(400).json({ success: false, message: 'Please verify your email first' });
      }

      return res.json({ 
        success: true, 
        userId: data.user.id,
        credits: userData.credits
      });
      
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
