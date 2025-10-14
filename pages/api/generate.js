// Simple in-memory store (for demo - would use database in production)
const usedIPs = new Set();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Get client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
    
    console.log('Request from IP:', ip);

    // Check if IP has used free credits (basic anti-abuse)
    const ipKey = `ip_${ip}`;
    const hasUsedFreeCredits = usedIPs.has(ipKey);
    
    if (!hasUsedFreeCredits) {
      console.log('First time user - granting free credits');
      usedIPs.add(ipKey);
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: process.env.REPLICATE_MODEL_VERSION,
        input: { 
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'API request failed');
    }

    const prediction = await response.json();
    
    let result;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(prediction.urls.get, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      result = await statusResponse.json();
      
      if (result.status === 'succeeded') {
        return res.json({ 
          imageUrl: result.output[0],
          freeCreditsUsed: !hasUsedFreeCredits 
        });
      } else if (result.status === 'failed') {
        throw new Error('AI generation failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Generation timeout');

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: error.message || 'AI generation failed'
    });
  }
}
