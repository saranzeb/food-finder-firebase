// app/api/add/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp
} from "firebase/firestore";

const FOOD_COLLECTION = "foodNodes";

// --- helper: ensure category exists (city-aware) ---
async function ensureCategory(name, parentId = null, city = null) {
  const colRef = collection(db, FOOD_COLLECTION);

  const filters = [
    where("type", "==", "category"),
    where("name", "==", name),
    where("parentId", "==", parentId)
  ];
  if (city) filters.push(where("city", "==", city));

  const q = query(colRef, ...filters);
  const snap = await getDocs(q);

  if (!snap.empty) return snap.docs[0].id;

  const docRef = await addDoc(colRef, {
    name,
    type: "category",
    parentId,
    city: city || null,
    createdAt: Timestamp.now()
  });
  return docRef.id;
}

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      category,
      subcategory,
      vendors = [],
      city
    } = body;

    if (!name || !category || !subcategory || !city) {
      return NextResponse.json(
        { error: "Missing required fields (name, category, subcategory, city)" },
        { status: 400 }
      );
    }

    // ensure category + subcategory
    const categoryId = await ensureCategory(category, null, city);
    const subCategoryId = await ensureCategory(subcategory, categoryId, city);

    // add item
    const colRef = collection(db, FOOD_COLLECTION);
    const docRef = await addDoc(colRef, {
      name,
      type: "item",
      category,
      subcategory,
      parentId: subCategoryId,
      city,
      vendors,
      createdAt: Timestamp.now(),
      source: "manual_add"
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (err) {
    console.error("ADD API ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
