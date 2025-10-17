const fs = require('fs');
const path = require('path');

// Path to users JSON file
const usersPath = path.join(process.cwd(), 'users.json');

// Helper functions to read/write users
function readUsers() {
    try {
        const data = fs.readFileSync(usersPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, email, password } = req.body;

        if (!action || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const users = readUsers();

        if (action === 'signup') {
            // Check if user already exists
            const existingUser = users.find(user => user.email === email);
            if (existingUser) {
                return res.json({ success: false, message: 'Email already exists' });
            }
            
            // Create new user
            const newUser = {
                id: 'user_' + Date.now(),
                email: email,
                password: password, // In real app, hash this!
                credits: 10,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            writeUsers(users);
            
            res.json({ 
                success: true, 
                message: 'User created successfully',
                credits: newUser.credits,
                userId: newUser.id
            });
            
        } else if (action === 'login') {
            // Find user and check password
            const user = users.find(u => u.email === email && u.password === password);
            if (user) {
                res.json({ 
                    success: true, 
                    message: 'Login successful',
                    credits: user.credits,
                    userId: user.id
                });
            } else {
                res.json({ success: false, message: 'Invalid email or password' });
            }
            
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
        
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};
