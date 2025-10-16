module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = '';
    req.on('data', chunk => body += chunk);
    
    await new Promise((resolve) => {
      req.on('end', resolve);
    });

    const { prompt } = JSON.parse(body);
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default;

    const modelVersion = "stability-ai/sdxl:7762fd07cf82c948538e41f63a2dbacc420d6aaa4f7e5ccee83e649e9c17ae4e";
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelVersion,
        input: { 
          prompt: prompt,
          width: 1024,
          height: 1024
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `API error: ${response.status}`);
    }

    const prediction = await response.json();
    
    let result;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(prediction.urls.get, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await statusResponse.json();
      
      if (result.status === 'succeeded') {
        return res.json({ imageUrl: result.output[0] });
      } else if (result.status === 'failed') {
        throw new Error('AI generation failed: ' + (result.error || 'Unknown error'));
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
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
