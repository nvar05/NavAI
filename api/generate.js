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
    
    console.log('Generate request - User ID:', userId, 'Prompt:', prompt);
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check user credits
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    console.log('User query result:', { user, userError });

    if (userError) {
      console.error('User query error:', userError);
      return res.status(400).json({ error: 'Database error: ' + userError.message });
    }

    if (!user) {
      console.error('User not found in database. Available users:');
      // List all users to debug
      const { data: allUsers } = await supabase.from('users').select('id, email');
      console.log('All users in database:', allUsers);
      return res.status(400).json({ error: 'User not found in database' });
    }

    if (user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    console.log('User found, proceeding with generation...');

    // Use dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default;

    // Call Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
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

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Replicate API failed: ${response.status} - ${errorData}`);
    }

    const prediction = await response.json();
    
    if (!prediction.id) {
      throw new Error('No prediction ID received from Replicate API');
    }

    console.log('Prediction started:', prediction.id);
    
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
      console.log(`Attempt ${attempts + 1}: Status - ${result.status}`);
      
      if (result.status === 'succeeded') {
        // Update user credits
        await supabase
          .from('users')
          .update({ credits: user.credits - 1 })
          .eq('id', userId);

        return res.json({ 
          success: true,
          imageUrl: result.output[0],
          creditsRemaining: user.credits - 1
        });
      } else if (result.status === 'failed') {
        throw new Error('AI generation failed: ' + (result.error || 'Unknown error'));
      }
      
      attempts++;
    }
    
    throw new Error('Generation timeout');

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: error.message || 'AI generation failed'
    });
  }
};
