const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
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
          emailRedirectTo: 'https://www.nav-ai.co.uk/index.html'
        }
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'This email is already registered. Please try logging in instead.' 
        });
      }

      if (data.user) {
        try {
          const { error: dbError } = await supabase
            .from('users')
            .upsert([{ 
              id: data.user.id, 
              email: email,
              credits: 10,
              verified: false
            }], {
              onConflict: 'id'
            });

          if (dbError) {
            console.log('Database note:', dbError.message);
          }
        } catch (dbError) {
          console.log('Database setup in progress:', dbError.message);
        }
      }

      return res.json({ 
        success: true, 
        message: '📧 VERIFICATION EMAIL SENT! Check your inbox (and spam folder) for the verification link.',
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

      // Get user data with ACTUAL credits from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits, verified')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return res.status(400).json({ success: false, message: 'User not found. Please sign up first.' });
      }

      if (!userData.verified) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please verify your email first. Check your inbox for the verification link.' 
        });
      }

      return res.json({ 
        success: true, 
        userId: data.user.id,
        credits: userData.credits, // Use ACTUAL credits from database
        message: '✅ Login successful! Welcome back.'
      });
      
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
