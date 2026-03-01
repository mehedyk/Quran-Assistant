// api/ask.js — Vercel Serverless Function
// This runs on the SERVER (not in the browser).
// The API key never touches the user's device.
// All Anthropic calls go through here.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // API key must be set in Vercel environment variables
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error: API key not set." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    console.error("Anthropic proxy error:", err);
    return res.status(500).json({ error: "Failed to reach AI service." });
  }
}
