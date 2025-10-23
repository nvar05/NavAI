const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
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
          emailRedirectTo: 'https://nav-ai.co.uk/verify.html' // FIXED: Use verify.html
        }
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      console.log('Signup response:', {
        user: data.user?.id,
        session: data.session ? 'exists' : 'none',
        identities: data.user?.identities?.length || 0
      });

      // Check if user already exists (identities array empty)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: '❌ This email is already registered. Please try logging in instead.' 
        });
      }

      // Create user record immediately
      if (data.user) {
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
          console.error('Database error:', dbError);
        }
      }

      return res.json({ 
        success: true, 
        message: '📧 VERIFICATION EMAIL SENT! Check your inbox (and spam folder) for the verification link. You MUST click the link to activate your account and get your 10 free credits.',
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

      // Check if user exists and is verified
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits, verified')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        return res.status(400).json({ success: false, message: '❌ User not found. Please sign up first.' });
      }

      if (!userData.verified) {
        return res.status(400).json({ 
          success: false, 
          message: '❌ EMAIL NOT VERIFIED! Please check your email and click the verification link first. You need to verify your email to access your account.' 
        });
      }

      return res.json({ 
        success: true, 
        userId: data.user.id,
        credits: userData.credits,
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
