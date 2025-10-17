const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Replicate only if token exists
let replicate;
if (process.env.REPLICATE_API_TOKEN) {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
}

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

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    const { prompt, userId } = JSON.parse(body);
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    console.log('Generation request for user:', userId);

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

    // Deduct 1 credit
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update credits' });
    }

    // Check if Replicate is configured
    if (!replicate) {
      // Return placeholder if Replicate not set up
      const placeholderImages = [
        'https://picsum.photos/512/512?random=1',
        'https://picsum.photos/512/512?random=2', 
        'https://picsum.photos/512/512?random=3'
      ];
      const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
      
      return res.json({ 
        success: true, 
        imageUrl: randomImage,
        creditsRemaining: user.credits - 1
      });
    }

    // Generate with Replicate
    const output = await replicate.run(
      "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
      {
        input: {
          prompt: prompt,
          width: 512,
          height: 512,
          num_outputs: 1
        }
      }
    );

    res.json({ 
      success: true, 
      imageUrl: output[0],
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation error:', error);
    
    // Refund credit
    try {
      const { userId } = JSON.parse(body);
      if (userId) {
        const { data: user } = await supabase
          .from('users')
          .select('credits')
          .eq('id', userId)
          .single();
          
        if (user) {
          await supabase
            .from('users')
            .update({ credits: user.credits + 1 })
            .eq('id', userId);
        }
      }
    } catch (refundError) {
      console.error('Failed to refund credit:', refundError);
    }
    
    res.status(500).json({ error: 'Failed to generate image' });
  }
};
