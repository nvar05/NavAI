const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase Config:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseKey 
});

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    console.log('Auth request body:', body);
    
    if (!body) {
      return res.status(400).json({ success: false, error: 'No body received' });
    }

    const data = JSON.parse(body);
    const { action, email, password } = data;

    console.log('Auth action:', action, 'email:', email);

    if (!action) {
      return res.status(400).json({ success: false, error: 'No action specified' });
    }

    if (action === 'signup') {
      if (!email || !password) {
        return res.json({ success: false, message: 'Email and password required' });
      }

      // Check if user already exists
      const { data: existingUser, error: lookupError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.json({ success: false, message: 'Email already exists' });
      }

      // Create new user
      const userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
      const userData = {
        id: userId,
        email: email,
        password: password,
        credits: 10,
        email_verified: false,
        created_at: new Date().toISOString()
      };

      console.log('Creating user:', userData);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.json({ success: false, message: 'Failed to create account: ' + insertError.message });
      }

      console.log('User created successfully:', newUser);

      res.json({ 
        success: true, 
        message: 'Account created! You have 10 free credits.',
        credits: 10,
        userId: userId
      });

    } else if (action === 'login') {
      if (!email || !password) {
        return res.json({ success: false, message: 'Email and password required' });
      }

      // Find user and validate password
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        console.log('Login error - user not found:', error);
        return res.json({ success: false, message: 'Invalid email or password' });
      }
      
      if (user.password !== password) {
        console.log('Login error - password mismatch');
        return res.json({ success: false, message: 'Invalid email or password' });
      }

      console.log('Login successful for user:', user.email);

      res.json({ 
        success: true, 
        message: 'Login successful',
        credits: user.credits,
        userId: user.id
      });

    } else {
      res.status(400).json({ success: false, error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
};
