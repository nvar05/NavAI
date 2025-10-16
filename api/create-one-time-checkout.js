const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  console.log('🎯 ONE-TIME CHECKOUT API CALLED');
  
  try {
    // Log the request
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);

    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('❌ STRIPE SECRET KEY MISSING');
      return res.status(500).json({ error: 'Stripe not configured' });
    } else {
      console.log('✅ Stripe key found');
    }

    const domain = process.env.YOUR_DOMAIN || 'https://nav-ai.co.uk';
    console.log('Using domain:', domain);
    
    console.log('🔄 Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: 'NavAI - 100 Credits Pack',
              description: 'One-time purchase of 100 AI image credits',
            },
            unit_amount: 99,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/plans.html`,
    });

    console.log('✅ Stripe session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);
    
    res.json({ 
      url: session.url,
      sessionId: session.id 
    });
    
  } catch (error) {
    console.error('❌ STRIPE ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Payment failed: ' + error.message,
      details: error.type 
    });
  }
};
