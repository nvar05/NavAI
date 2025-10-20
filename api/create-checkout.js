const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan, userId } = req.body;

    if (!plan || !userId) {
      return res.status(400).json({ error: 'Missing plan or user ID' });
    }

    const prices = {
      basic: 'price_1Q9ABCDEFGHIJKLMNOPQRSTU',
      pro: 'price_1Q9ABCDEFGHIJKLMNOPQRSTV', 
      unlimited: 'price_1Q9ABCDEFGHIJKLMNOPQRSTW'
    };

    const priceId = prices[plan];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.YOUR_DOMAIN}/success.html?payment_success=true&plan=${plan}&user_id=${userId}`,
      cancel_url: `${process.env.YOUR_DOMAIN}/plans.html`,
      client_reference_id: userId,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
