const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, creditsToAdd } = req.body;

    if (!userId || !creditsToAdd) {
      return res.status(400).json({ error: 'User ID and credits are required' });
    }

    // Get current credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Update credits in database
    const newCredits = user.credits + creditsToAdd;
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to update credits');
    }

    res.json({ success: true, newCredits });

  } catch (error) {
    console.error('Update credits error:', error);
    res.status(500).json({ error: error.message });
  }
};
