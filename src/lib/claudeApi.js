import { authedFetch } from "./apiClient.js";

// Every Claude call in the app goes through the /api/claude serverless proxy
// so the Anthropic key stays server-side — the caller just needs to be signed in.
export async function callClaude(system, userMsg, maxTokens = 3000) {
  const { ok, status, data } = await authedFetch("/api/claude", { system, userMsg, maxTokens });
  if (!ok) throw new Error(data.error || `API error ${status}`);
  return data.text || "";
}
