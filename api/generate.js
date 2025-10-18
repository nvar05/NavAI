const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, userId } = req.body;
    
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    if (!userId) return res.status(400).json({ error: 'Missing user ID' });

    console.log('Generation request:', prompt.substring(0, 50));

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) return res.status(400).json({ error: 'User not found' });
    if (user.credits < 1) return res.status(400).json({ error: 'Insufficient credits' });

    // Deduct credit
    await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    console.log('Calling Replicate API...');

    // Use a faster, more reliable model with timeout
    const generatePromise = replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63a46b0cb243f32c5fb44d091c19e8e48d2f6ba77",
      {
        input: {
          prompt: prompt,
          width: 512,
          height: 512,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 20
        }
      }
    );

    // Add timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout after 45 seconds')), 45000);
    });

    const output = await Promise.race([generatePromise, timeoutPromise]);
    
    console.log('Image generated successfully!');
    
    res.json({ 
      success: true, 
      imageUrl: output[0],
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation failed:', error);
    
    // Refund credit
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
        }
      }
    } catch (refundError) {
      console.error('Refund failed:', refundError);
    }
    
    res.status(500).json({ error: error.message });
  }
};
