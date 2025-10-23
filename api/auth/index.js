const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
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
    const { action, email, password } = req.body;
    
    if (!action || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('Auth request:', action, email);

    // Simple auth without Supabase for now
    if (action === 'signup') {
      const userId = 'user_' + Date.now();
      return res.json({ 
        success: true, 
        userId: userId,
        credits: 10
      });
      
    } else if (action === 'login') {
      const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '');
      return res.json({ 
        success: true, 
        userId: userId,
        credits: 10
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
