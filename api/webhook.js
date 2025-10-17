const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Plan credit mappings
const PLAN_CREDITS = {
  'price_basic': 100,    // Basic plan - 100 credits
  'price_pro': 800,      // Pro plan - 800 credits  
  'price_unlimited': 1500, // Unlimited plan - 1500 credits
  'price_onetime': 100   // One-time purchase - 100 credits
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const priceId = session.line_items?.data[0]?.price?.id || session.metadata?.priceId;

    console.log('Payment successful for user:', userId, 'price:', priceId);

    if (userId && priceId && PLAN_CREDITS[priceId]) {
      const creditsToAdd = PLAN_CREDITS[priceId];
      
      try {
        // Get current user credits
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('credits')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          return res.status(400).json({ error: 'User not found' });
        }

        // Update user credits
        const newCredits = user.credits + creditsToAdd;
        const { error: updateError } = await supabase
          .from('users')
          .update({ credits: newCredits })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating credits:', updateError);
          return res.status(500).json({ error: 'Failed to update credits' });
        }

        console.log(`Added ${creditsToAdd} credits to user ${userId}. New total: ${newCredits}`);
        
      } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    }
  }

  res.json({ received: true });
};
