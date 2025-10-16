const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'POST') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      
      await new Promise((resolve) => {
        req.on('end', resolve);
      });

      const { plan } = JSON.parse(body);
      
      const planDetails = {
        basic: { amount: 200, name: 'Basic Plan - 300 Credits' },
        pro: { amount: 500, name: 'Pro Plan - 800 Credits' },
        unlimited: { amount: 1000, name: 'Unlimited Plan - 2000 Credits' }
      };
      
      const selectedPlan = planDetails[plan] || { amount: 200, name: 'Basic Plan' };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: selectedPlan.name,
            },
            unit_amount: selectedPlan.amount,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'https://nav-ai.co.uk/success.html',
        cancel_url: 'https://nav-ai.co.uk/plans.html',
      });

      res.json({ url: session.url });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
