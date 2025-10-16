const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const domain = process.env.YOUR_DOMAIN || 'https://nav-ai.co.uk';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1SIzNkLGtnLpxero8Ws7aqYV', // 99p price ID
          quantity: 1,
        },
      ],
      mode: 'payment', // This should be 'payment' for one-time, not 'subscription'
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/plans.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
