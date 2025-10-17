const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

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

    const { prompt, userId } = JSON.parse(body);
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Check user credits first
    db.get('SELECT credits FROM users WHERE id = ?', [userId], async (err, row) => {
      if (err || !row) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (row.credits <= 0) {
        return res.status(402).json({ error: 'Insufficient credits' });
      }

      // Deduct 1 credit
      db.run('UPDATE users SET credits = credits - 1 WHERE id = ?', [userId], async function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Credit update failed' });
        }

        // Now proceed with AI generation (your existing code)
        try {
          const fetch = (await import('node-fetch')).default;
          const modelVersion = "stability-ai/sdxl:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe";
          
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
              // Get updated credit balance
              db.get('SELECT credits FROM users WHERE id = ?', [userId], (creditErr, creditRow) => {
                if (creditErr) {
                  return res.json({ imageUrl: result.output[0], credits: row.credits - 1 });
                }
                res.json({ 
                  imageUrl: result.output[0], 
                  credits: creditRow.credits 
                });
              });
              return;
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
      });
    });
    
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ 
      error: error.message || 'Server error'
    });
  }
};
