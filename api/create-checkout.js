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

    const { plan } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const prices = {
      basic: 'price_1SIzMALGtnLpxero9ODFsPzy',
      pro: 'price_1SIzMkLGtnLpxerooYEqLTAe',
      unlimited: 'price_1SIzNALGtnLpxero7EDYtT39'
    };

    const priceId = prices[plan];
    
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan: ' + plan });
    }

    const domain = process.env.YOUR_DOMAIN || 'https://nav-ai.co.uk';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/plans.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
