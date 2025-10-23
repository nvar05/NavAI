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

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ✅ NEW: Check if email is verified before generating
    console.log('Checking email verification...');
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('Auth verification error:', authError);
      return res.status(400).json({ error: 'Authentication error' });
    }
    
    if (!authData.user.email_confirmed_at) {
      console.log('User email not verified');
      return res.status(400).json({ error: 'Please verify your email address before generating images. Check your inbox for the verification link.' });
    }

    console.log('Email verified, proceeding with generation...');

    // Call Replicate API with detailed logging
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

    console.log('Replicate response status:', replicateResponse.status);

    const responseText = await replicateResponse.text();
    console.log('Replicate raw response:', responseText);

    if (!replicateResponse.ok) {
      console.error('Replicate API failed with status:', replicateResponse.status);
      throw new Error(`Replicate API failed: ${replicateResponse.status} - ${responseText}`);
    }

    let prediction;
    try {
      prediction = JSON.parse(responseText);
      console.log('Parsed prediction:', JSON.stringify(prediction, null, 2));
    } catch (parseError) {
      console.error('Failed to parse Replicate response:', parseError);
      throw new Error('Invalid JSON from Replicate API');
    }

    if (!prediction.id) {
      console.error('NO PREDICTION ID FOUND IN RESPONSE');
      console.error('Response keys:', Object.keys(prediction));
      throw new Error('No prediction ID received. Replicate response: ' + JSON.stringify(prediction));
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
        console.log('Output URL:', result.output[0]);
        return res.json({ 
          imageUrl: result.output[0]
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
