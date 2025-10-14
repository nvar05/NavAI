const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Serve static files
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, 'index.html', 'text/html');
  } else if (pathname === '/about.html') {
    serveFile(res, 'about.html', 'text/html');
  } else if (pathname === '/generate.html') {
    serveFile(res, 'generate.html', 'text/html');
  } else if (pathname === '/plans.html') {
    serveFile(res, 'plans.html', 'text/html');
  } else if (pathname === '/contact.html') {
    serveFile(res, 'contact.html', 'text/html');
  } else if (pathname === '/style.css') {
    serveFile(res, 'style.css', 'text/css');
  } else if (pathname === '/script.js') {
    serveFile(res, 'script.js', 'application/javascript');
  } else if (pathname === '/api/generate' && req.method === 'POST') {
    await handleAIRequest(req, res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

function serveFile(res, filename, contentType) {
  const filePath = path.join(__dirname, filename);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

async function handleAIRequest(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { prompt } = JSON.parse(body);
      
      // REAL REPLICATE API CALL
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
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ imageUrl: result.output[0] }));
          return;
        } else if (result.status === 'failed') {
          throw new Error('AI generation failed');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      throw new Error('Generation timeout');

    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
