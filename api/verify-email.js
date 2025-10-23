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
    const { access_token } = JSON.parse(req.body);
    
    if (!access_token) {
      return res.status(400).json({ success: false, message: 'Invalid verification link' });
    }

    console.log('Email verification attempt');

    // Verify the token and get user session
    const { data, error } = await supabase.auth.getUser(access_token);
    
    if (error || !data.user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }
    
    // Mark user as verified in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', data.user.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
    }
    
    // Get user data
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
    
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
