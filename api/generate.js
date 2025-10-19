const { createClient } = require('@supabase/supabase-js');
const Replicate = require('replicate');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, userId } = req.body;
    
    if (!prompt || !userId) {
      return res.status(400).json({ error: 'Missing prompt or user ID' });
    }

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

    await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', userId);

    const output = await replicate.run(
      "stability-ai/sdxl:7762fd07cf82c948538e41f63a46b0cb243f32c5fb44d091c19e8e48d2f6ba77",
      {
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      }
    );
    
    const imageUrl = output[0];
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      creditsRemaining: user.credits - 1
    });

  } catch (error) {
    console.error('Generation failed:', error);
    res.status(500).json({ error: error.message });
  }
};
