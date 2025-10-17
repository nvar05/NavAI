// Simple auth for Vercel - with debugging
let users = [];

module.exports = async (req, res) => {
    console.log('Auth endpoint called');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Request headers:', req.headers);
        
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        await new Promise((resolve) => req.on('end', resolve));
        console.log('Raw body:', body);
        
        const data = JSON.parse(body);
        console.log('Parsed data:', data);
        
        const { action, email, password } = data;

        if (!action || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (action === 'signup') {
            const existingUser = users.find(user => user.email === email);
            if (existingUser) {
                return res.json({ success: false, message: 'Email already exists' });
            }
            
            const newUser = {
                id: 'user_' + Date.now(),
                email: email,
                password: password,
                credits: 10
            };
            
            users.push(newUser);
            
            res.json({ 
                success: true, 
                message: 'User created successfully',
                credits: newUser.credits,
                userId: newUser.id
            });
            
        } else if (action === 'login') {
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
        }
        
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};
