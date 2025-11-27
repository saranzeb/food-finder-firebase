// app/api/browse/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";     // ✅ correct shared DB import
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc
} from "firebase/firestore";

const FOOD_COLLECTION = "foodNodes";

// ----------------------------------
// MAPPING HELPERS (KEPT FROM OLD VERSION)
// ----------------------------------
function mapCategoryDoc(docSnap) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    name: d.name,
    type: d.type || "category",
    parentId: d.parentId ?? null,
    path: d.path ?? null,
    city: d.city ?? null         // ⭐ now included for correctness
  };
}

function mapItemDoc(docSnap) {
  const d = docSnap.data();
  return {
    id: docSnap.id,
    name: d.name,
    type: "item",
    parentId: d.parentId ?? null,
    path: d.path ?? null,
    vendors: Array.isArray(d.vendors) ? d.vendors : [],
    city: d.city ?? null
  };
}

// ----------------------------------
// MAIN HANDLER
// ----------------------------------
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const listType = searchParams.get("listType");
    const parentId = searchParams.get("parentId");
    const cityValue = searchParams.get("city");   // ⭐ REQUIRED

    if (!listType) {
      return NextResponse.json(
        { error: "Missing listType" },
        { status: 400 }
      );
    }

    const col = collection(db, FOOD_COLLECTION);

    // ==============================
    // 1) ROOT CATEGORIES
    // ==============================
    if (listType === "categories") {
      const q = query(
        col,
        where("type", "==", "category"),
        where("parentId", "==", null),

        // ⭐ NEW: city-aware categories (compatible with new vendor system)
        where("city", "==", cityValue)
      );

      const snap = await getDocs(q);
      return NextResponse.json(snap.docs.map(mapCategoryDoc));
    }

    // ==============================
    // 2) SUBCATEGORIES
    // ==============================
    if (listType === "subcategories") {
      if (!parentId) return NextResponse.json([]);

      const q = query(
        col,
        where("type", "==", "category"),
        where("parentId", "==", parentId),

        // ⭐ NEW: city filtering for subcategories
        where("city", "==", cityValue)
      );

      const snap = await getDocs(q);
      return NextResponse.json(snap.docs.map(mapCategoryDoc));
    }

    // ==============================
    // 3) ITEMS
    // ==============================
    if (listType === "items") {
      if (!parentId) return NextResponse.json([]);

      const q = query(
        col,
        where("type", "==", "item"),
        where("parentId", "==", parentId),
        where("city", "==", cityValue)     // ⭐ ALREADY IN YOUR OLD CODE
      );

      const snap = await getDocs(q);
      return NextResponse.json(snap.docs.map(mapItemDoc));
    }

    return NextResponse.json({ error: "Invalid listType" }, { status: 400 });

  } catch (err) {
    console.error("Browse API Error:", err);
    return NextResponse.json(
      { error: "Failed to load browse data" },
      { status: 500 }
    );
  }
}
