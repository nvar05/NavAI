// Simple file-based auth for Vercel
const fs = require('fs');
const path = require('path');

// Path to users JSON file
const usersPath = '/tmp/users.json';

// Helper functions to read/write users
function readUsers() {
    try {
        if (fs.existsSync(usersPath)) {
            const data = fs.readFileSync(usersPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.log('No users file found, starting fresh');
    }
    return {};
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing users:', error);
        return false;
    }
}

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

        const users = readUsers();

        if (action === 'signup') {
            // Check if user already exists
            if (users[email]) {
                return res.json({ success: false, message: 'Email already exists' });
            }
            
            // Create new user
            const userId = 'user_' + Date.now();
            users[email] = {
                id: userId,
                email: email,
                password: password,
                credits: 10,
                createdAt: new Date().toISOString()
            };
            
            // Save users
            if (writeUsers(users)) {
                res.json({ 
                    success: true, 
                    message: 'User created successfully',
                    credits: 10,
                    userId: userId
                });
            } else {
                res.status(500).json({ error: 'Failed to create user' });
            }
            
        } else if (action === 'login') {
            // Find user and validate password
            const user = users[email];
            if (!user) {
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
