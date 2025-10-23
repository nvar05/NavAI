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

    // PROPER USER CREDIT CHECK WITH CREATION
    let userCredits = 10;
    let userExists = false;

    try {
      // First, try to get user credits
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError) {
        console.log('User not found, creating user...');
        // User doesn't exist - create them with minimal required fields
        const { error: createError } = await supabase
          .from('users')
          .insert([{ 
            id: userId,
            email: `user-${userId}@temp.com`, // Required field
            credits: 10,
            created_at: new Date().toISOString() // Usually required
          }]);
        
        if (createError) {
          console.error('Failed to create user:', createError);
          // If creation fails, use default credits but don't block generation
          userCredits = 10;
        } else {
          console.log('User created successfully');
          userExists = true;
          userCredits = 10;
        }
      } else {
        // User exists
        userExists = true;
        userCredits = userData.credits;
        console.log('User found with credits:', userCredits);
      }
    } catch (error) {
      console.error('User handling error:', error);
      // Use default credits on error
      userCredits = 10;
    }

    // CHECK CREDITS
    if (userCredits < 1) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    console.log('Proceeding with generation, user credits:', userCredits);

    // Use dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default;

    // CALL REPLICATE API
    console.log('Calling Replicate API...');
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

    console.log('Replicate response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API failed:', errorText);
      throw new Error(`Replicate API failed: ${response.status}`);
    }

    const prediction = await response.json();
    console.log('Prediction response:', prediction);
    
    if (!prediction.id) {
      console.error('No prediction ID in response:', prediction);
      throw new Error('No prediction ID received from Replicate API');
    }

    console.log('Prediction started:', prediction.id);
    
    // POLL FOR COMPLETION
    let result;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`Checking prediction status - Attempt ${attempts + 1}`);
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check prediction status');
      }
      
      result = await statusResponse.json();
      console.log(`Status ${attempts + 1}:`, result.status);
      
      if (result.status === 'succeeded') {
        console.log('Generation succeeded! Output:', result.output);
        
        // DEDUCT CREDITS ONLY IF USER EXISTS
        if (userExists) {
          try {
            await supabase
              .from('users')
              .update({ credits: userCredits - 1 })
              .eq('id', userId);
            console.log('Credits updated:', userCredits - 1);
          } catch (updateError) {
            console.error('Failed to update credits:', updateError);
          }
        }

        return res.json({ 
          success: true,
          imageUrl: result.output[0],
          creditsRemaining: userCredits - 1
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
