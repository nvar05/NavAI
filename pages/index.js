import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setImage(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (res.ok) {
        setImage(data.image);
      } else {
        alert(data.error || "Failed to generate image");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>nvar.ai — Image Generator (demo)</h1>
      <form onSubmit={handleGenerate}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt (e.g. 'cyberpunk barber portrait')"
          style={{ width: "70%" }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </form>
      <div style={{ marginTop: 16 }}>
        {image && <img src={image} alt="generated" style={{ maxWidth: "600px", width: "100%", borderRadius: 8 }} />}
      </div>
      <p style={{ marginTop: 12, color: "#666" }}>
        This demo uses a server-side API route to call an image model (Replicate).
      </p>
    </main>
  );
}

