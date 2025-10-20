import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
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
    const { action, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Create user record with initial credits
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          { 
            id: data.user.id, 
            email: email,
            credits: 10 
          }
        ]);

      if (dbError) {
        return res.status(400).json({ error: dbError.message });
      }

      res.json({ 
        success: true, 
        userId: data.user.id, 
        credits: 10 
      });

    } else if (action === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Get user credits
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        return res.status(400).json({ error: userError.message });
      }

      res.json({ 
        success: true, 
        userId: data.user.id, 
        credits: user.credits 
      });

    } else {
      res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
}
