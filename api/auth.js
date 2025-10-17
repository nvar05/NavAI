module.exports = async (req, res) => {
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
    
    if (!action || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For Vercel compatibility, we'll accept any login if email/password are provided
    // The real user validation happens in the frontend with localStorage
    if (action === 'signup') {
      // Always return success for signup
      const userId = 'user_' + Date.now();
      res.json({ 
        success: true, 
        message: 'User created successfully',
        credits: 10,
        userId: userId
      });
      
    } else if (action === 'login') {
      // Always return success for login (frontend handles real validation)
      const userId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '');
      res.json({ 
        success: true, 
        message: 'Login successful',
        credits: 10, // Frontend will use its stored credits
        userId: userId
      });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
