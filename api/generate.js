const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { prompt, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    let userCredits = null;
    if (userId) {
      const { data: user, error: userError } = await supabase.from('users').select('credits, verified').eq('id', userId).single();
      if (userError) {
        userCredits = 10;
      } else if (!user) {
        return res.status(400).json({ error: 'User not found' });
      } else if (!user.verified) {
        return res.status(400).json({ error: 'Please verify your email first' });
      } else if (user.credits <= 0) {
        return res.status(400).json({ error: 'Insufficient credits' });
      } else {
        userCredits = user.credits;
      }
    }
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ version: "6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe", input: { prompt, width: 1024, height: 1024, num_outputs: 1 } })
    });
    if (!replicateResponse.ok) throw new Error(`Replicate API failed: ${replicateResponse.status}`);
    const prediction = await replicateResponse.json();
    if (!prediction.id) throw new Error('No prediction ID received');
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts && result.status !== 'succeeded' && result.status !== 'failed') {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, { headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` } });
      result = await statusResponse.json();
    }
    if (result.status === 'succeeded') {
      if (userId && userCredits !== null && userCredits !== 10) {
        await supabase.from('users').update({ credits: userCredits - 1 }).eq('id', userId);
      }
      return res.json({ imageUrl: result.output[0], creditsUsed: (userId && userCredits !== null && userCredits !== 10) ? 1 : 0 });
    } else {
      throw new Error('AI generation failed or timeout');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
};
