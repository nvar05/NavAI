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
          emailRedirectTo: 'https://nav-ai.co.uk/verify.html'
        }
      });

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Create user record immediately (don't wait for verification)
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
        message: '📧 Verification email sent! Check your inbox (and spam folder) for the verification link. Click the link to activate your account and get 10 free credits!',
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

      if (userError) {
        console.error('User lookup error:', userError);
        // Create user if doesn't exist (shouldn't happen but just in case)
        const { error: createError } = await supabase
          .from('users')
          .upsert([{ 
            id: data.user.id, 
            email: email,
            credits: 10,
            verified: true // Assume verified if they can login
          }], {
            onConflict: 'id'
          });
        
        if (createError) {
          return res.status(400).json({ success: false, message: 'User account issue. Please contact support.' });
        }
        
        return res.json({ 
          success: true, 
          userId: data.user.id,
          credits: 10
        });
      }

      if (!userData.verified) {
        return res.status(400).json({ success: false, message: '❌ Please verify your email first! Check your inbox for the verification link to get your 10 free credits.' });
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
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
