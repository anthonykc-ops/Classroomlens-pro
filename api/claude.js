import { getAuthedUser } from "./_lib/getAuthedUser.js";

const MAX_TOKENS_CEILING = 4096;

function getApiKey() {
  const source = process.env.ANTHROPIC_API_KEY ? "ANTHROPIC_API_KEY" : "VITE_ANTHROPIC_API_KEY";
  const raw = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  // Defends against the two most common ways a Vercel dashboard paste goes
  // wrong: a trailing newline/space, and literal quote characters left in
  // because the value was copied with its surrounding quotes.
  const key = raw?.trim().replace(/^["']|["']$/g, "");
  if (!key) throw new Error("Server misconfigured: ANTHROPIC_API_KEY must be set.");
  if (key === "sk-ant-your-key-goes-here") {
    throw new Error(`Server misconfigured: ${source} is still set to the placeholder value from .env.example.`);
  }
  // Safe to log: only the source var name, length, and last 4 chars — never
  // enough to reconstruct the key, but enough to tell in Vercel's function
  // logs whether the placeholder value or a stale/truncated key is what's
  // actually configured.
  console.log(`[claude] using key from ${source} (len=${key.length}, ...${key.slice(-4)})`);
  return key;
}

// Every AI generation call in the app routes through here so the Anthropic key
// stays on the server — this just requires a signed-in user, it does not meter
// usage. Callers that should count against a trial/plan limit (observation,
// IEP, PLC, lesson-plan analysis) call /api/track-observation first and only
// reach this endpoint if that allows it.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const user = await getAuthedUser(req);
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { system, userMsg, maxTokens } = req.body || {};
    if (!userMsg || typeof userMsg !== "string") {
      return res.status(400).json({ error: "userMsg is required" });
    }

    const anthRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: Math.min(Math.max(Number(maxTokens) || 1000, 1), MAX_TOKENS_CEILING),
        system: system || "",
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!anthRes.ok) {
      const err = await anthRes.json().catch(() => ({}));
      return res.status(anthRes.status).json({ error: err?.error?.message || `Claude API error ${anthRes.status}` });
    }

    const data = await anthRes.json();
    const text = (data.content || []).map(c => c.text || "").join("");
    return res.status(200).json({ text });
  } catch (e) {
    console.error("claude proxy error", e);
    return res.status(500).json({ error: e.message || "AI request failed" });
  }
}
