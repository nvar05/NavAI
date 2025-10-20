export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Your existing logic here
  try {
    // Add your existing function logic
    res.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
}
