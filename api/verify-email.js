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
    const { access_token, refresh_token } = JSON.parse(req.body);
    
    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Invalid verification link' });
    }

    console.log('Email verification attempt');

    // Set the session using the access token from the verification link
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });
    
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    
    if (data.user) {
      // Mark user as verified in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ verified: true })
        .eq('id', data.user.id);
      
      if (updateError) {
        console.error('Update error:', updateError);
      }
      
      // Get user data to return for auto-login
      const { data: userData } = await supabase
        .from('users')
        .select('credits, email')
        .eq('id', data.user.id)
        .single();
      
      return res.json({ 
        success: true, 
        message: 'Email verified successfully!',
        userId: data.user.id,
        credits: userData?.credits || 10,
        email: userData?.email || data.user.email
      });
    } else {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
