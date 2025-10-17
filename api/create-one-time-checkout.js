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

    const { userId } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User not logged in' });
    }

    const domain = 'https://www.nav-ai.co.uk';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1SIzNkLGtnLpxero8Ws7aqYV',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&plan=onetime&payment_success=true`,
      cancel_url: `${domain}/plans.html`,
      metadata: {
        userId: userId,
        planType: 'onetime'
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
