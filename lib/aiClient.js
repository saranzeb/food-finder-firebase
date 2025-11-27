/* ----------------------------------------------------------
   UNIVERSAL AI CLIENT – Supports:
   DeepSeek (default), OpenAI, Gemini, Claude
----------------------------------------------------------- */

export const ACTIVE_PROVIDER = "deepseek"; 

/* ----------------------------------------------------------
   🟠 1. DEEPSEEK — FREE & WORKS IN CHINA
----------------------------------------------------------- */
async function callDeepSeek(foodName) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log("DEEPSEEK_KEY_LOADED:", apiKey); // debug

	const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: `
Return ONLY valid JSON for the food item "${foodName}".
{
 "name": "",
 "category": "",
 "subcategory": "",
 "vendors": [
   {"name":"", "url":""}
 ]
}
          `,
        },
      ],
      temperature: 0.2,
    }),
  });

  const json = await response.json();
  console.log("RAW_DEEPSEEK_RESPONSE:", json); // debug

  if (json.error) {
    throw new Error(json.error.message);
  }

  if (!json.choices || !json.choices[0]) {
    throw new Error("DeepSeek returned no answer");
  }

  const text = json.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("DeepSeek returned no JSON");
  }

  return JSON.parse(jsonMatch[0]);
}


/* ----------------------------------------------------------
   🔵 2. OPENAI (NOT DEFAULT ANYMORE)
----------------------------------------------------------- */
async function callOpenAI(foodName) {
  throw new Error("OpenAI disabled — no free quota");
}

async function callGemini(foodName) { throw new Error("Not enabled"); }
async function callClaude(foodName) { throw new Error("Not enabled"); }

/* ----------------------------------------------------------
   🔥 MAIN DISPATCH
----------------------------------------------------------- */
export const aiClient = {
  async searchFood(foodName) {
    switch (ACTIVE_PROVIDER) {
      case "deepseek": return callDeepSeek(foodName);
      case "openai": return callOpenAI(foodName);
      case "gemini": return callGemini(foodName);
      case "claude": return callClaude(foodName);
      default:
        throw new Error("Unknown provider");
    }
  },
};
