import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { aiClient } from "@/lib/aiClient";

// ---------------------
// FIREBASE CONFIG
// ---------------------
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

const FOOD_COLLECTION = "foodNodes";

// ===============================================
//  🔥 MAIN SEARCH API — DB → AI FALLBACK
// ===============================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const foodName = searchParams.get("foodName");
    const cityValue = searchParams.get("city");

    if (!foodName) {
      return NextResponse.json(
        { error: "Missing foodName" },
        { status: 400 }
      );
    }

    const cleanName = foodName.trim();

    // ===========================================
    // 1️⃣ SEARCH FIRESTORE FIRST
    // ===========================================
    try {
      const q = query(
        collection(db, FOOD_COLLECTION),
        where("type", "==", "item"),
        where("city", "==", cityValue),
        where("name", "==", cleanName)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const itemDoc = snap.docs[0];
        const item = itemDoc.data();

        let categoryName = null;
        let subcategoryName = null;

        if (item.parentId) {
          const subSnap = await getDoc(
            doc(db, FOOD_COLLECTION, item.parentId)
          );
          if (subSnap.exists()) {
            const subcat = subSnap.data();
            subcategoryName = subcat.name;

            if (subcat.parentId) {
              const catSnap = await getDoc(
                doc(db, FOOD_COLLECTION, subcat.parentId)
              );
              if (catSnap.exists()) {
                categoryName = catSnap.data().name;
              }
            }
          }
        }

        return NextResponse.json({
          source: "database",
          result: {
            name: item.name,
            category: categoryName,
            subcategory: subcategoryName,
            vendors: Array.isArray(item.vendors) ? item.vendors : [],
          },
        });
      }
    } catch (err) {
      console.warn("Firestore search error:", err.message);
    }

    // ===========================================
    // 2️⃣ NOT FOUND → ASK AI (UNIVERSAL CLIENT)
    // ===========================================
    try {
      const aiResult = await aiClient.searchFood(cleanName);

      return NextResponse.json({
        source: "ai",
        result: aiResult,
      });
    } catch (err) {
      console.error("AI Search Error:", err);
      return NextResponse.json(
        { error: "AI search failed", details: err.message },
        { status: 500 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: err.message },
      { status: 500 }
    );
  }
}
