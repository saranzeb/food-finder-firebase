// pages/api/food.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import OpenAI from "openai";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const { query } = req.body; // manual entry from user
  console.log("📩 User query:", query);

  try {
    // 1. Fetch categories from Firestore
    const snapshot = await getDocs(collection(db, "foodCategories"));
    const categories = snapshot.docs.map(doc => doc.data());

    // 2. Try to find a match
    let match = null;
    for (const category of categories) {
      if (query.toLowerCase().includes(category.name.toLowerCase())) {
        match = category;
        break;
      }
      for (const sub of category.subcategories) {
        if (query.toLowerCase().includes(sub.name.toLowerCase())) {
          match = sub;
          break;
        }
        for (const item of sub.items) {
          if (query.toLowerCase().includes(item.name.toLowerCase())) {
            match = item;
            break;
          }
          for (const dish of item.dishes) {
            if (query.toLowerCase().includes(dish.name.toLowerCase())) {
              match = dish;
              break;
            }
          }
        }
      }
    }

    if (match) {
      console.log("✅ Found in DB");
      return res.status(200).json({ source: "db", result: match });
    }

    // 3. If not found → ask LLM
    console.log("🤖 Asking OpenAI");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a food assistant. Suggest categories, subcategories, and dish URLs." },
        { role: "user", content: `User entered: "${query}". Suggest best matching category, subcategory, dish, and a valid URL.` },
      ],
    });

    const suggestion = response.choices[0].message.content;
    return res.status(200).json({ source: "llm", result: suggestion });

  } catch (err) {
    console.error("❌ API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
