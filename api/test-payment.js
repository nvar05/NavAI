module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('Test API called');
    res.json({ 
      success: true, 
      message: 'API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
