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

    // Parse request body for Vercel
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise((resolve) => req.on('end', resolve));
    
    console.log('Raw body received:', body);
    
    const { plan, userId } = JSON.parse(body);
    
    console.log('Parsed plan:', plan);
    console.log('Parsed userId:', userId);
    
    if (!userId) {
      console.log('No userId provided');
      return res.status(400).json({ error: 'User not logged in' });
    }

    if (!plan) {
      console.log('No plan provided');
      return res.status(400).json({ error: 'Plan is required' });
    }

    const prices = {
      basic: 'price_1SIzMALGtnLpxero9ODFsPzy',
      pro: 'price_1SIzMkLGtnLpxerooYEqLTAe',
      unlimited: 'price_1SIzNALGtnLpxero7EDYtT39'
    };

    const priceId = prices[plan];
    
    if (!priceId) {
      console.log('Invalid plan:', plan);
      return res.status(400).json({ error: 'Invalid plan: ' + plan });
    }

    console.log('Creating Stripe session for plan:', plan, 'userId:', userId);
    
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
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&plan=${plan}&payment_success=true`,
      cancel_url: `${domain}/plans.html`,
      metadata: {
        userId: userId,
        planType: plan
      }
    });

    console.log('Stripe session created:', session.id);
    res.json({ url: session.url });
    
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
