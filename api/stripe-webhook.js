const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      const userId = session.metadata.userId;
      const planType = session.metadata.planType;
      
      // Define credit amounts for each plan
      const creditAmounts = {
        basic: 100,
        pro: 800,
        unlimited: 1500
      };
      
      const creditsToAdd = creditAmounts[planType] || 0;
      
      if (userId && creditsToAdd > 0) {
        db.run('UPDATE users SET credits = credits + ? WHERE id = ?', [creditsToAdd, userId], function(err) {
          if (err) {
            console.error('Failed to add credits:', err);
          } else {
            console.log(`Added ${creditsToAdd} credits to user ${userId}`);
          }
        });
      }
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};
