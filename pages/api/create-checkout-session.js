const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { plan, amount, credits } = req.body;

      const planDetails = {
        basic: { name: 'Basic Plan - 300 Image Credits', description: '300 images per month' },
        pro: { name: 'Pro Plan - 800 Image Credits', description: '800 images per month' },
        unlimited: { name: 'Unlimited Plan - 2000 Image Credits', description: '2000 images per month' }
      };

      const selectedPlan = planDetails[plan] || { name: 'NavAI Image Credits', description: 'AI Image Generation Credits' };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'gbp',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: amount,
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
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
