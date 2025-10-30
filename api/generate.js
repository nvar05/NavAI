const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Set CORS headers
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
    let body = '';
    req.on('data', chunk => body += chunk);
    
    await new Promise((resolve) => {
      req.on('end', resolve);
    });

    const { prompt, userId } = JSON.parse(body);
    
    console.log('=== GENERATE REQUEST ===');
    console.log('Prompt:', prompt);
    console.log('User ID:', userId);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let userCredits = null;

    // If userId provided, check Supabase credits and verify user
    if (userId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits, verified')
        .eq('id', userId)
        .single();

      if (userError) {
        console.log('User not found in Supabase, falling back to localStorage mode');
        // Allow generation without Supabase verification for existing users
        userCredits = 1; // Assume they have at least 1 credit
      } else if (!user) {
        return res.status(400).json({ error: 'User not found' });
      } else if (!user.verified) {
        return res.status(400).json({ error: 'Please verify your email first' });
      } else if (user.credits <= 0) {
        return res.status(400).json({ error: 'Insufficient credits' });
      } else {
        userCredits = user.credits;
        console.log('User credits from Supabase:', userCredits);
      }
      }

      if (!user) {
        return res.status(400).json({ error: 'User not found' });
      }

      if (!user.verified) {
        return res.status(400).json({ error: 'Please verify your email first' });
      }

      if (user.credits <= 0) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      userCredits = user.credits;
      console.log('User credits before:', userCredits);
    }
    // If no userId, frontend handles credits via localStorage (existing system)

    // Call Replicate API
    console.log('Calling Replicate API...');
    
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
        input: { 
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      })
    });

    if (!replicateResponse.ok) {
      throw new Error(`Replicate API failed: ${replicateResponse.status}`);
    }

    const prediction = await replicateResponse.json();

    if (!prediction.id) {
      throw new Error('No prediction ID received');
    }

    console.log('Prediction ID received:', prediction.id);
    
    // Poll for completion
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`Polling attempt ${attempts}/${maxAttempts}`);
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await statusResponse.json();
      console.log(`Poll result ${attempts}:`, result.status);
      
      if (result.status === 'succeeded') {
        console.log('=== GENERATION SUCCEEDED ===');
        
        // Deduct credit if userId provided (verified user)
        if (userId && userCredits !== null) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ credits: userCredits - 1 })
            .eq('id', userId);

          if (updateError) {
            console.error('Credit update error:', updateError);
          } else {
            console.log('Credit deducted successfully from Supabase');
          }
        }
        
        return res.json({ 
          imageUrl: result.output[0],
          creditsUsed: userId ? 1 : 0
        });
      } else if (result.status === 'failed') {
        throw new Error('AI generation failed');
      }
    }
    
    throw new Error('Generation timeout');

  } catch (error) {
    console.error('=== GENERATION ERROR ===');
    console.error(error);
    res.status(500).json({ 
      error: error.message || 'AI generation failed'
    });
  }
};
