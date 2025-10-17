const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }
        
        const { userId } = JSON.parse(body);
        
        if (!userId) {
            return res.status(400).json({ error: 'User not logged in' });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: '100 AI Image Credits',
                            description: 'One-time purchase of 100 image generation credits'
                        },
                        unit_amount: 99, // £0.99
                    },
                    quantity: 1,
                },
            ],
            success_url: `https://www.nav-ai.co.uk/success.html?payment_success=true&plan=onetime&user_id=${userId}`,
            cancel_url: `https://www.nav-ai.co.uk/plans.html`,
            metadata: {
                userId: userId,
                plan: 'onetime'
            }
        });

        res.json({ url: session.url });
        
    } catch (error) {
        console.error('One-time checkout error:', error);
        res.status(500).json({ error: error.message });
    }
};
