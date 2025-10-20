import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
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
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      return res.status(400).json({ error: 'Missing prompt or user ID' });
    }

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Call Replicate API directly using fetch
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe',
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      })
    });

    if (!replicateResponse.ok) {
      throw new Error('Replicate API request failed');
    }

    const prediction = await replicateResponse.json();
    
    if (!prediction.urls || !prediction.urls.get) {
      throw new Error('Invalid response from Replicate');
    }

    // Update credits
    await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    res.json({
      success: true,
      imageUrl: prediction.urls.get,
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
}
