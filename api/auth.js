const fs = require('fs');
const path = require('path');

// Simple user storage
const usersFile = path.join(process.cwd(), 'users.json');

// Load users from file
function loadUsers() {
  try {
    if (fs.existsSync(usersFile)) {
      return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return {};
}

// Save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, email, password } = JSON.parse(req.body);
    
    const users = loadUsers();

    if (action === 'signup') {
      // Check if user exists
      if (users[email]) {
        return res.json({ success: false, message: 'Email already exists' });
      }

      // Create new user
      users[email] = {
        email: email,
        password: password, // In real app, hash this!
        credits: 10,
        createdAt: new Date().toISOString()
      };

      if (saveUsers(users)) {
        res.json({ 
          success: true, 
          message: 'Account created! You have 10 free credits.',
          credits: 10,
          userId: email
        });
      } else {
        res.status(500).json({ error: 'Failed to create account' });
      }

    } else if (action === 'login') {
      // Check if user exists and password matches
      const user = users[email];
      if (!user || user.password !== password) {
        return res.json({ success: false, message: 'Invalid email or password' });
      }

      res.json({ 
        success: true, 
        message: 'Login successful',
        credits: user.credits,
        userId: email
      });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
