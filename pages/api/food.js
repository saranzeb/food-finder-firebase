// pages/api/food.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import OpenAI from "openai";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalize(s){ return (s||"").toLowerCase(); }
function buildPath(nodesMap, node){
  const path = [];
  let cur = node;
  while(cur){
    path.unshift({ id: cur.id, name: cur.name });
    cur = cur.parentId ? nodesMap[cur.parentId] : null;
  }
  return path;
}

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"POST only" });
  const { query: userQuery } = req.body || {};
  if (!userQuery) return res.status(400).json({ ok:false, error:"Missing query" });

  try {
    const snap = await getDocs(collection(db, "foodNodes"));
    const nodes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const nodesMap = Object.fromEntries(nodes.map(n => [n.id,n]));

    const q = normalize(userQuery);
    // simple substring search across node.name
    const match = nodes.find(n => normalize(n.name).includes(q));
    if (match) {
      const path = buildPath(nodesMap, match);
      return res.status(200).json({ ok:true, source:"db", match, path });
    }

    // LLM fallback: ask for strict JSON
    const system = `You are a food taxonomy assistant. When given a user phrase, return ONLY valid JSON with keys:
{"suggested_parent":string|null, "suggested_name":string, "suggested_url":string|null}
If unsure provide suggested_url=null.`;
    const userPrompt = `User input: "${userQuery}" — suggest a parent category name (if any), a normalized item/dish name, and a useful URL (or null). Return ONLY JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
      temperature: 0.2,
      max_tokens: 300,
    });

    const text = response.choices?.[0]?.message?.content || "";
    let parsed;
    try { parsed = JSON.parse(text); }
    catch(e){ parsed = { raw: text }; }

    return res.status(200).json({ ok:true, source:"llm", suggestion: parsed });

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ ok:false, error: err.message || String(err) });
  }
}
