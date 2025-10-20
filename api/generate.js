import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
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

    console.log('Generating image for user:', userId, 'Prompt:', prompt);

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User error:', userError);
      return res.status(400).json({ error: 'User not found' });
    }

    if (user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    console.log('User has credits:', user.credits);

    // Use node-fetch instead of Replicate SDK to avoid compatibility issues
    const fetch = (await import('node-fetch')).default;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "stability-ai/sdxl:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Replicate API error: ${errorData.detail || response.status}`);
    }

    const prediction = await response.json();
    console.log('Prediction started:', prediction.id);

    // Poll for completion
    let result;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await statusResponse.json();
      console.log(`Attempt ${attempts + 1}: Status = ${result.status}`);
      
      if (result.status === 'succeeded') {
        break;
      } else if (result.status === 'failed') {
        throw new Error('Generation failed: ' + (result.error || 'Unknown error'));
      }
      
      attempts++;
    }

    if (!result || result.status !== 'succeeded') {
      throw new Error('Generation timeout');
    }

    // Safely get image URL from result
    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    console.log('Generation succeeded! Image URL:', imageUrl);
    
    if (!imageUrl) {
      throw new Error('No image URL received from AI service');
    }

    // Update credits
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    if (updateError) {
      console.error('Credit update error:', updateError);
    }

    res.json({
      success: true,
      imageUrl: imageUrl,
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation failed:', error);
    res.status(500).json({ error: error.message });
  }
}
