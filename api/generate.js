const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

  console.log('Generation request received:', { 
    prompt: req.body.prompt?.substring(0, 50) + '...',
    userId: req.body.userId 
  });

  try {
    const { prompt, userId } = req.body;

    if (!prompt || !userId) {
      console.log('Missing prompt or userId');
      return res.status(400).json({ error: 'Missing prompt or user ID' });
    }

    // Fetch user from Supabase
    console.log('Fetching user from Supabase...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.log('User not found:', userError);
      return res.status(400).json({ error: 'User not found' });
    }

    console.log('User credits:', user.credits);

    if (user.credits < 1) {
      console.log('Insufficient credits');
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct 1 credit
    console.log('Deducting credit...');
    await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    // Generate image with Replicate
    console.log('Calling Replicate API...');
    console.log('Model: bytedance/sdxl-lightning-4step');
    console.log('Prompt:', prompt);

    const output = await replicate.run(
      "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      }
    );

    console.log('Replicate output received:', output);

    if (!output || !output[0]) {
      throw new Error('No image URL returned from Replicate');
    }

    const imageUrl = output[0];
    console.log('Generated image URL:', imageUrl);

    // Return success response
    res.json({
      success: true,
      imageUrl: imageUrl,
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation failed:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Image generation failed. Please try again.'
    });
  }
};
