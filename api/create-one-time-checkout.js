const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = '';
        req.on('data', chunk => body += chunk);
        await new Promise((resolve) => req.on('end', resolve));
        
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
            success_url: `https://www.nav-ai.co.uk/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `https://www.nav-ai.co.uk/plans.html`,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                priceId: 'price_onetime'
            }
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('One-time checkout error:', error);
        res.status(500).json({ error: error.message });
    }
};
