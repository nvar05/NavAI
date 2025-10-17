// Supabase auth for Vercel
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise((resolve) => req.on('end', resolve));
    
    const { action, email, password } = JSON.parse(body);
    
    if (!action || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action === 'signup') {
      // Check if user already exists
      const { data: existingUser, error: lookupError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.json({ success: false, message: 'Email already exists' });
      }

      // Create new user
      const userId = 'user_' + Date.now();
      const userData = {
        id: userId,
        email: email,
        password: password, // In production, hash this!
        credits: 10,
        created_at: new Date().toISOString()
      };

      // Insert user into Supabase
      const { data, error } = await supabase
        .from('users')
        .insert([userData]);

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      res.json({ 
        success: true, 
        message: 'User created successfully',
        credits: 10,
        userId: userId
      });
      
    } else if (action === 'login') {
      // Find user and validate password
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.json({ success: false, message: 'Invalid email or password' });
      }
      
      if (user.password !== password) {
        return res.json({ success: false, message: 'Invalid email or password' });
      }
      
      res.json({ 
        success: true, 
        message: 'Login successful',
        credits: user.credits,
        userId: user.id
      });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
