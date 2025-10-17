const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
        console.log('No users file found');
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

function addCreditsToUser(userId, creditsToAdd) {
    const users = readUsers();
    let userUpdated = false;
    
    for (const email in users) {
        if (users[email].id === userId) {
            users[email].credits += creditsToAdd;
            userUpdated = true;
            break;
        }
    }
    
    if (userUpdated) {
        writeUsers(users);
        return true;
    }
    return false;
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        await new Promise((resolve) => req.on('end', resolve));
        
        const { plan, userId } = JSON.parse(body);
        
        if (!userId) {
            return res.status(400).json({ error: 'User not logged in' });
        }

        const prices = {
            basic: 'price_1SIzMALGtnLpxero9ODFsPzy',
            pro: 'price_1SIzMkLGtnLpxerooYEqLTAe',
            unlimited: 'price_1SIzNALGtnLpxero7EDYtT39'
        };

        const priceId = prices[plan];
        
        if (!priceId) {
            return res.status(400).json({ error: 'Invalid plan: ' + plan });
        }

        const creditAmounts = {
            basic: 100,
            pro: 800,
            unlimited: 1500
        };

        const creditsToAdd = creditAmounts[plan] || 100;
        
        const domain = 'https://www.nav-ai.co.uk';
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&plan=${plan}&credits=${creditsToAdd}&payment_success=true`,
            cancel_url: `${domain}/plans.html`,
            metadata: {
                userId: userId,
                planType: plan,
                credits: creditsToAdd.toString()
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
};
