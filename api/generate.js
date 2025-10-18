const { createClient } = require("@supabase/supabase-js");
const Replicate = require("replicate");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { prompt, userId } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    if (!userId) return res.status(400).json({ error: "Missing user ID" });
    console.log("Generation request:", prompt.substring(0, 50));
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();
    if (userError || !user) return res.status(400).json({ error: "User not found" });
    if (user.credits < 1) return res.status(400).json({ error: "Insufficient credits" });
    await supabase
      .from("users")
      .update({ credits: user.credits - 1 })
      .eq("id", userId);
    console.log("Calling Replicate API...");
    const output = await replicate.run(
      "bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe",
      {
        input: {
          prompt: prompt,
          width: 512,
          height: 512,
          num_outputs: 1
        }
      }
    );
    console.log("Image generated successfully!");
    res.json({ 
      success: true, 
      imageUrl: output[0],
      creditsRemaining: user.credits - 1
    });
  } catch (error) {
    console.error("Generation failed:", error);
    try {
      const { userId } = req.body;
      if (userId) {
        const { data: user } = await supabase
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();
        if (user) {
          await supabase
            .from("users")
            .update({ credits: user.credits + 1 })
            .eq("id", userId);
        }
      }
    } catch (refundError) {
      console.error("Refund failed:", refundError);
    }
    res.status(500).json({ error: error.message });
  }
};
