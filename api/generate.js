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

    // Check user credits - handle case where user doesn't exist
    let user;
    let credits = 10; // Default credits
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError) {
        console.log('User not found in database, creating user...');
        // Create user with default credits
        const { error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: userId, 
            email: 'temp@user.com', // Temporary email
            credits: 10 
          }]);
        
        if (createError) {
          console.error('Failed to create user:', createError);
          // Continue with default credits even if creation fails
        } else {
          console.log('User created successfully');
        }
        user = { credits: 10 };
      } else {
        user = userData;
      }
    } catch (error) {
      console.error('User lookup error:', error);
      // Use default credits if lookup fails
      user = { credits: 10 };
    }

    if (!user || user.credits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    console.log('User credits:', user.credits, 'Proceeding with generation...');

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
        // Update user credits if user exists
        try {
          await supabase
            .from('users')
            .update({ credits: user.credits - 1 })
            .eq('id', userId);
        } catch (updateError) {
          console.error('Failed to update credits:', updateError);
          // Continue even if credit update fails
        }

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
