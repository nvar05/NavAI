const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

module.exports = async (req, res) => {
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, userId } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    console.log('AI Generation request for user:', userId, 'Prompt:', prompt);

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

    // Deduct 1 credit FIRST
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update credits' });
    }

    console.log('Calling Replicate API...');
    
    // Generate real AI image with Replicate
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

    console.log('AI Image generated successfully!');

    res.status(200).json({ 
      success: true, 
      imageUrl: output[0],
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('AI Generation error:', error);
    
    // Refund credit if generation failed
    try {
      const { userId } = req.body;
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
          console.log('Credit refunded due to generation failure');
        }
      }
    } catch (refundError) {
      console.error('Failed to refund credit:', refundError);
    }
    
    res.status(500).json({ error: 'AI generation failed: ' + error.message });
  }
};
