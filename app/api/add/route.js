import { NextResponse } from "next/server";
import { db } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const body = await req.json();
    const { category, subcategory, item, vendors } = body;

    if (!category || !item) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docData = {
      name: item,
      parent: subcategory || category || null,
      type: "item",
      vendors: vendors || [],
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, "foods"), docData);

    return NextResponse.json({ success: true, data: docData });
  } catch (err) {
    console.error("Error adding item:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
