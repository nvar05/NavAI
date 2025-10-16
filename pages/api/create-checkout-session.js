import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { plan } = req.body;
      
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

      res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('Stripe error:', err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
