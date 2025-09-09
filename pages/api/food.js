// app/api/food/route.js (Next.js App Router API)
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// Firebase config from environment (Vercel provides these via env vars)
const firebaseConfig = JSON.parse(
  typeof __firebase_config !== "undefined" ? __firebase_config : "{}"
);
const __app_id =
  typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// Initialize Firebase
const app = initializeApp(firebaseConfig, __app_id);
const db = getFirestore(app);

// Unified handler for API requests
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const listType = searchParams.get("list");
    const categoryName = searchParams.get("category");
    const subcategoryName = searchParams.get("subcategory");

    // Fetch all top-level categories (parentId == null)
    if (listType === "categories") {
      const q = query(collection(db, "foodNodes"), where("type", "==", "category"));
      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(d => !d.parentId) // filter parentId == null in JS
        .map(d => d.name);

      return new Response(JSON.stringify(categories), { status: 200 });
    }

    // Fetch subcategories for a given category name
    if (categoryName && listType === "subcategories") {
      const q = query(collection(db, "foodNodes"), where("name", "==", categoryName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return new Response(JSON.stringify({ error: "Category not found." }), { status: 404 });
      }

      const categoryId = querySnapshot.docs[0].id;
      const subQuery = query(collection(db, "foodNodes"), where("parentId", "==", categoryId));
      const subSnap = await getDocs(subQuery);

      const subcategories = subSnap.docs.map(doc => doc.data().name);
      return new Response(JSON.stringify(subcategories), { status: 200 });
    }

    // Fetch food items for a given subcategory
    if (categoryName && subcategoryName) {
      const q = query(collection(db, "foodNodes"), where("name", "==", categoryName));
      const categorySnap = await getDocs(q);

      if (categorySnap.empty) {
        return new Response(JSON.stringify({ error: "Category not found." }), { status: 404 });
      }

      const categoryId = categorySnap.docs[0].id;
      const subQuery = query(
        collection(db, "foodNodes"),
        where("name", "==", subcategoryName),
        where("parentId", "==", categoryId)
      );
      const subSnap = await getDocs(subQuery);

      if (subSnap.empty) {
        return new Response(JSON.stringify({ error: "Subcategory not found." }), { status: 404 });
      }

      const subcategoryId = subSnap.docs[0].id;
      const itemsQuery = query(
        collection(db, "foodNodes"),
        where("type", "==", "item"),
        where("parentId", "==", subcategoryId)
      );
      const itemsSnap = await getDocs(itemsQuery);

      const items = itemsSnap.docs.map(doc => ({
        name: doc.data().name,
        url: doc.data().url,
      }));

      return new Response(JSON.stringify(items), { status: 200 });
    }

    return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400 });
  } catch (e) {
    console.error("API Error:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
