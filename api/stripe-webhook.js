const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // For Vercel, we need to get the raw body
    let body = '';
    req.on('data', chunk => body += chunk);
    await new Promise((resolve) => req.on('end', resolve));
    
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Get user ID from session metadata (we need to pass this from frontend)
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType;
      
      if (userId && planType) {
        // Define credit amounts for each plan
        const creditAmounts = {
          basic: 100,
          pro: 800,
          unlimited: 1500
        };
        
        const creditsToAdd = creditAmounts[planType] || 100;
        
        // Update user credits in localStorage (via frontend)
        // Note: This is a limitation - we can't directly update localStorage from server
        // In a real app, you'd use a database
        
        console.log(`Payment successful: User ${userId} bought ${planType} plan, should add ${creditsToAdd} credits`);
        
        // For now, we'll log it and the frontend will need to handle the credit update
        // when the user returns to the site
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
