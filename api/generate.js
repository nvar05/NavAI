const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = '';
  let parsedBody = {};
  
  try {
    for await (const chunk of req) {
      body += chunk;
    }
    parsedBody = JSON.parse(body);
    
    const { prompt, userId } = parsedBody;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID. Please log in again.' });
    }

    console.log('Generation request for user:', userId, 'Prompt:', prompt);

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userId, userError);
      return res.status(400).json({ error: 'User not found. Please log in again.' });
    }

    if (user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    console.log('User credits before deduction:', user.credits);

    // Deduct 1 credit FIRST
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    if (updateError) {
      console.error('Credit update error:', updateError);
      return res.status(500).json({ error: 'Failed to update credits' });
    }

    console.log('Calling Replicate API...');
    
    // Generate image with timeout
    const output = await Promise.race([
      replicate.run(
        "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
        {
          input: {
            prompt: prompt,
            width: 512,
            height: 512,
            num_outputs: 1
          }
        }
      ),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Generation timeout')), 30000)
      )
    ]);

    console.log('Image generated successfully for user:', userId);

    res.json({ 
      success: true, 
      imageUrl: output[0],
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation error:', error);
    
    // Refund credit if generation failed
    try {
      if (parsedBody.userId) {
        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('id', parsedBody.userId)
          .single();
          
        if (user) {
          await supabase
            .from('users')
            .update({ credits: user.credits + 1 })
            .eq('id', parsedBody.userId);
          console.log('Credit refunded for user:', parsedBody.userId);
        }
      }
    } catch (refundError) {
      console.error('Failed to refund credit:', refundError);
    }
    
    res.status(500).json({ error: 'Failed to generate image: ' + error.message });
  }
};
