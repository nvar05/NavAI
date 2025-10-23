import { createClient } from '@supabase/supabase-js';

// Use service role on server. If missing, it will fall back to anon (not recommended).
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY
);

async function getFetchImpl() {
  if (typeof fetch !== 'undefined') return fetch;
  // dynamic import node-fetch for Vercel Node environment if needed
  return (await import('node-fetch')).default;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action } = req.body;

    if (!action || (action !== 'start' && action !== 'status')) {
      return res.status(400).json({ error: 'Missing or invalid action' });
    }

    // START: begin a Replicate prediction and return id immediately
    if (action === 'start') {
      const { prompt, userId } = req.body;
      if (!prompt || !userId) return res.status(400).json({ error: 'Missing prompt or userId' });

      // verify user exists and has credits
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('User lookup error:', userError);
        return res.status(400).json({ error: 'User not found' });
      }

      if ((user.credits || 0) < 1) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      // start prediction
      const fetchImpl = await getFetchImpl();
      const startResp = await fetchImpl('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Use your desired model version
          version: "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
          input: {
            prompt,
            width: 1024,
            height: 1024,
            num_outputs: 1
          }
        })
      });

      if (!startResp.ok) {
        const txt = await startResp.text().catch(() => '');
        console.error('Replicate start error', startResp.status, txt);
        return res.status(500).json({ error: 'Failed to start prediction' });
      }

      const prediction = await startResp.json();
      console.log('Started prediction:', prediction.id);

      // Insert lightweight record for idempotency (predictions table required)
      await supabase.from('predictions').upsert({
        id: prediction.id,
        user_id: userId,
        credits_deducted: false
      }).catch(e => console.error('Upsert predictions record failed', e));

      return res.json({ success: true, predictionId: prediction.id });
    }

    // STATUS: check status, when succeeded return imageUrl and deduct credits idempotently
    if (action === 'status') {
      const { predictionId, userId } = req.body;
      if (!predictionId || !userId) return res.status(400).json({ error: 'Missing predictionId or userId' });

      const fetchImpl = await getFetchImpl();
      const statusResp = await fetchImpl(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
      });

      if (!statusResp.ok) {
        const txt = await statusResp.text().catch(() => '');
        console.error('Replicate status fetch failed', statusResp.status, txt);
        return res.status(500).json({ error: 'Failed to fetch prediction status' });
      }

      const result = await statusResp.json();
      const status = result.status;

      if (status === 'succeeded') {
        // Extract image URL (Replicate sometimes returns array)
        const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        if (!imageUrl) {
          console.error('No output URL in prediction result', result);
          return res.status(500).json({ error: 'No image URL from model' });
        }

        // Idempotent deduction: only deduct once per prediction
        const { data: record, error: recordError } = await supabase
          .from('predictions')
          .select('credits_deducted')
          .eq('id', predictionId)
          .single();

        if (recordError) {
          console.error('Predictions lookup error (non-fatal):', recordError);
        }

        if (!record || record.credits_deducted === false) {
          // fetch user's credits
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('credits')
            .eq('id', userId)
            .single();

          if (!userError && user) {
            const newCredits = Math.max(0, (user.credits || 0) - 1);
            const { error: updateError } = await supabase
              .from('users')
              .update({ credits: newCredits })
              .eq('id', userId);

            if (updateError) {
              console.error('Failed to deduct credits (non-fatal):', updateError);
            } else {
              // mark prediction as deducted & save image_url
              await supabase.from('predictions').upsert({
                id: predictionId,
                user_id: userId,
                credits_deducted: true,
                image_url: imageUrl
              }).catch(e => console.error('Upsert after success failed', e));
            }
          } else {
            console.error('Could not fetch user for deduction:', userError);
          }
        }

        // return image URL and fresh credits
        const { data: userFresh } = await supabase.from('users').select('credits').eq('id', userId).single().catch(() => ({ data: null }));
        return res.json({
          success: true,
          status,
          imageUrl,
          creditsRemaining: userFresh ? userFresh.credits : null
        });
      }

      if (status === 'failed') {
        return res.json({ success: false, status: 'failed', error: result.error || 'Generation failed' });
      }

      // still processing
      return res.json({ success: true, status });
    }
  } catch (err) {
    console.error('generate handler error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
