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

    const { access_token, refresh_token } = JSON.parse(body);
    
    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Invalid verification link' });
    }

    console.log('Email verification attempt');

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error || !user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    
    console.log('User found:', user.id);
    
    // MARK USER AS VERIFIED
    const { error: updateError } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(400).json({ success: false, message: 'Failed to verify user' });
    }
    
    console.log('User marked as verified:', user.id);
    
    return res.json({ 
      success: true, 
      message: 'Email verified successfully!',
      userId: user.id,
      credits: 10,
      email: user.email
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
