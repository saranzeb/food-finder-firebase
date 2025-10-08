import { NextResponse } from "next/server";
import { db } from "@/firebase"; // your existing firebase.js
import { collection, query, where, getDocs } from "firebase/firestore";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // store this in .env.local
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const foodName = searchParams.get("foodName");
  if (!foodName) {
    return NextResponse.json({ error: "Missing foodName" }, { status: 400 });
  }

  try {
    // 🔹 Step 1: Try finding in Firestore
    const q = query(collection(db, "foods"), where("name", "==", foodName));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const items = snap.docs.map((doc) => doc.data());
      return NextResponse.json({ source: "database", results: items });
    }

    // 🔹 Step 2: If not found, ask GPT
    const gptPrompt = `
      Provide a JSON array of 3 popular vendors or restaurants where one can find "${foodName}".
      Include name and valid website URL.
      Example format:
      [
        {"name": "Restaurant A", "url": "https://example.com"},
        {"name": "Restaurant B", "url": "https://example.com"}
      ]
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: gptPrompt }],
    });

    const text = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(text);

    return NextResponse.json({
      source: "gpt",
      results: [
        {
          name: foodName,
          vendors: parsed,
        },
      ],
    });
  } catch (err) {
    console.error("Error searching:", err);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
