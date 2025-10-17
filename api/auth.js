const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

// Create users table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        credits INTEGER DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = '';
        req.on('data', chunk => body += chunk);
        await new Promise((resolve) => req.on('end', resolve));
        
        const { action, email, password } = JSON.parse(body);

        if (action === 'signup') {
            // Check if user exists
            db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (row) {
                    return res.json({ success: false, message: 'Email already exists' });
                }
                
                // Create new user with 10 free credits
                db.run('INSERT INTO users (email, password, credits) VALUES (?, ?, 10)', 
                      [email, password], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to create user' });
                    }
                    res.json({ 
                        success: true, 
                        message: 'User created',
                        credits: 10,
                        userId: this.lastID
                    });
                });
            });
            
        } else if (action === 'login') {
            db.get('SELECT id, email, credits FROM users WHERE email = ? AND password = ?', 
                  [email, password], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (row) {
                    res.json({ 
                        success: true, 
                        message: 'Login successful',
                        credits: row.credits,
                        userId: row.id
                    });
                } else {
                    res.json({ success: false, message: 'Invalid email or password' });
                }
            });
            
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
        
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
