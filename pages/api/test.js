export default function handler(req, res) {
  res.status(200).json({ 
    working: true,
    message: "API is running!",
    timestamp: new Date().toISOString()
  });
}
