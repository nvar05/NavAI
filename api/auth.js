// In-memory user storage (resets on server restart, but works with Vercel)
let users = [];

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
            const existingUser = users.find(user => user.email === email);
            if (existingUser) {
                return res.json({ success: false, message: 'Email already exists' });
            }
            
            // Create new user
            const newUser = {
                id: 'user_' + Date.now(),
                email: email,
                password: password,
                credits: 10,
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            console.log('New user signed up:', email);
            
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
                console.log('User logged in:', email);
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
