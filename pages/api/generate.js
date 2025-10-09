export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.REPLICATE_API_TOKEN;
  const modelVersion = process.env.REPLICATE_MODEL_VERSION;
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    console.log("Sending request to Replicate...");
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: modelVersion,
        input: { prompt }
      })
    });

    const result = await response.json();
    console.log("Initial Replicate response:", result);

    if (result.status === "error") {
      return res.status(500).json({ error: result.detail || "Generation failed" });
    }

    // Polling for completion
    let status = result.status;
    let finalResult = result;
    const getUrl = (id) => `https://api.replicate.com/v1/predictions/${id}`;

    if (status !== "succeeded" && result.id) {
      const id = result.id;
      for (let i = 0; i < 30 && status !== "succeeded" && status !== "failed"; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(getUrl(id), {
          headers: { "Authorization": `Token ${token}` }
        });
        finalResult = await poll.json();
        status = finalResult.status;
        console.log(`Polling ${i + 1}:`, status);
      }
    }

    if (finalResult.status === "succeeded") {
      const output = Array.isArray(finalResult.output) ? finalResult.output[0] : finalResult.output;
      return res.status(200).json({ image: output });
    } else {
      return res.status(500).json({ error: "Image generation failed" });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

