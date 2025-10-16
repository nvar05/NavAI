import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { plan, amount, credits } = req.body;

      // Define plan names and descriptions
      const planDetails = {
        basic: { name: 'Basic Plan - 300 Image Credits', description: '300 images per month - Great for casual use' },
        pro: { name: 'Pro Plan - 800 Image Credits', description: '800 images per month - Most Popular' },
        unlimited: { name: 'Unlimited Plan - 2000 Image Credits', description: '2000 images per month - Best value' }
      };

      const selectedPlan = planDetails[plan] || { name: 'NavAI Image Credits', description: 'AI Image Generation Credits' };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: selectedPlan.name,
                description: selectedPlan.description,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `https://nav-ai.co.uk/success?session_id={CHECKOUT_SESSION_ID}&credits=${credits}`,
        cancel_url: `https://nav-ai.co.uk/plans`,
        metadata: {
          plan: plan,
          credits: credits.toString()
        }
      });

      console.log('Stripe session created for plan:', plan);
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
