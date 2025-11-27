/* ----------------------------------------------------------
   UNIVERSAL AI CLIENT – Supports:
   OpenAI (default), Gemini, Claude, DeepSeek
----------------------------------------------------------- */
export const ACTIVE_PROVIDER = "openai";  // <── MUST BE EXPORTED

import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyAgent = new HttpsProxyAgent("http://127.0.0.1:7897");

async function callOpenAI(foodName) {
  const apiKey = process.env.OPENAI_API_KEY;
  const client = new OpenAI({
    apiKey,
    fetch: (url, options) =>
      fetch(url, { ...options, agent: proxyAgent }),
  });

  const prompt = `
Return ONLY valid JSON for the food item "${foodName}".
{
 "name": "",
 "category": "",
 "subcategory": "",
 "vendors": [
   {"name":"", "url":""}
 ]
}
`;
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const text = completion.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error("OpenAI did NOT return JSON");

  return JSON.parse(jsonMatch[0]);
}



/* ----------------------------------------------------------
   🟦 2. GEMINI (future)
----------------------------------------------------------- */
async function callGemini(foodName) {
  throw new Error("Gemini not enabled yet");
}

/* ----------------------------------------------------------
   🟣 3. CLAUDE (future)
----------------------------------------------------------- */
async function callClaude(foodName) {
  throw new Error("Claude not enabled yet");
}

/* ----------------------------------------------------------
   🟠 4. DEEPSEEK (future)
----------------------------------------------------------- */
async function callDeepSeek(foodName) {
  throw new Error("DeepSeek not enabled yet");
}


/* ----------------------------------------------------------
   🔥 MAIN DISPATCH ENTRY
----------------------------------------------------------- */
export const aiClient = {
  async searchFood(foodName) {
    switch (ACTIVE_PROVIDER) {
      case "openai": return callOpenAI(foodName);
      case "gemini": return callGemini(foodName);
      case "claude": return callClaude(foodName);
      case "deepseek": return callDeepSeek(foodName);
      default:
        throw new Error("Unknown provider");
    }
  },
};
