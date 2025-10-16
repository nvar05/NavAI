const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { plan } = JSON.parse(req.body);
    
    // Define your Stripe prices (you need to create these in Stripe dashboard)
    const prices = {
      basic: 'price_basic_monthly', // Replace with your actual price ID
      pro: 'price_pro_monthly',     // Replace with your actual price ID  
      unlimited: 'price_unlimited_monthly' // Replace with your actual price ID
    };

    const priceId = prices[plan];
    
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.YOUR_DOMAIN}/plans.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};
