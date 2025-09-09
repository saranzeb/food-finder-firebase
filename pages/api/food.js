// pages/api/food.js
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";

// Firebase client config from environment variables (set these in Vercel dashboard)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize app only once
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

export default async function handler(req, res) {
  try {
    const { method, query: reqQuery } = req;

    if (method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { list, category, subcategory } = reqQuery;

    // 1. Get top-level categories
    if (list === "categories") {
      const q = query(
        collection(db, "foodNodes"),
        where("type", "==", "category"),
        where("parentId", "==", null)
      );
      const snap = await getDocs(q);
      const categories = snap.docs.map((doc) => doc.data().name);
      return res.status(200).json(categories);
    }

    // 2. Get subcategories of a category
    if (list === "subcategories" && category) {
      const categoryQuery = query(
        collection(db, "foodNodes"),
        where("name", "==", category),
        where("parentId", "==", null)
      );
      const categorySnap = await getDocs(categoryQuery);

      if (categorySnap.empty) {
        return res.status(404).json({ error: "Category not found" });
      }

      const categoryId = categorySnap.docs[0].id;
      const subcategoryQuery = query(
        collection(db, "foodNodes"),
        where("parentId", "==", categoryId)
      );
      const subSnap = await getDocs(subcategoryQuery);
      const subcategories = subSnap.docs.map((doc) => doc.data().name);
      return res.status(200).json(subcategories);
    }

    // 3. Get items under subcategory
    if (category && subcategory) {
      const categoryQuery = query(
        collection(db, "foodNodes"),
        where("name", "==", category),
        where("parentId", "==", null)
      );
      const categorySnap = await getDocs(categoryQuery);
      if (categorySnap.empty) {
        return res.status(404).json({ error: "Category not found" });
      }

      const categoryId = categorySnap.docs[0].id;
      const subQuery = query(
        collection(db, "foodNodes"),
        where("name", "==", subcategory),
        where("parentId", "==", categoryId)
      );
      const subSnap = await getDocs(subQuery);
      if (subSnap.empty) {
        return res.status(404).json({ error: "Subcategory not found" });
      }

      const subId = subSnap.docs[0].id;
      const itemsQuery = query(
        collection(db, "foodNodes"),
        where("type", "==", "item"),
        where("parentId", "==", subId)
      );
      const itemsSnap = await getDocs(itemsQuery);
      const items = itemsSnap.docs.map((doc) => ({
        name: doc.data().name,
        url: doc.data().url || null,
      }));
      return res.status(200).json(items);
    }

    // Default: invalid query
    return res.status(400).json({ error: "Invalid request" });
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
