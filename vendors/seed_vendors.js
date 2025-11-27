/**
 * FINAL SEED SCRIPT — FULLY WORKING
 * ✔ Creates category
 * ✔ Creates subcategory
 * ✔ Saves vendors correctly
 * ✔ Sets correct parentId
 * ✔ Works with your UI + API
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import admin from "firebase-admin";

// ----------------------
// Load service key
// ----------------------
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceKey.json", "utf8")
);

// ----------------------
// Init Firebase Admin
// ----------------------
initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

// ----------------------
// Paths
// ----------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VENDORS_DIR = path.join(__dirname, "beijing");

// ----------------------
// Ensure Category (root)
// ----------------------
async function ensureRootCategory(name, city) {
  const col = db.collection("foodNodes");
  const q = col
    .where("type", "==", "category")
    .where("name", "==", name)
    .where("parentId", "==", null)
    .where("city", "==", city);

  const snap = await q.get();
  if (!snap.empty) return snap.docs[0].id;

  const ref = await col.add({
    name,
    type: "category",
    parentId: null,
    city,
    createdAt: Timestamp.now(),
  });

  return ref.id;
}

// ----------------------
// Ensure Subcategory
// parentId = ID of main category
// ----------------------
async function ensureSubcategory(name, parentId, city) {
  const col = db.collection("foodNodes");
  const q = col
    .where("type", "==", "category")
    .where("name", "==", name)
    .where("parentId", "==", parentId)
    .where("city", "==", city);

  const snap = await q.get();
  if (!snap.empty) return snap.docs[0].id;

  const ref = await col.add({
    name,
    type: "category",
    parentId,
    city,
    createdAt: Timestamp.now(),
  });

  return ref.id;
}

// ----------------------
// Insert item with correct parentId + vendors
// ----------------------
async function insertItem(item, city, vendorLinks, subcategoryId) {
  const col = db.collection("foodNodes");

  // Build vendor link buttons
  const vendors = [];

  if (vendorLinks.meituan)
    vendors.push({ name: "Meituan", url: vendorLinks.meituan });

  if (vendorLinks.eleme)
    vendors.push({ name: "Eleme", url: vendorLinks.eleme });

  if (vendorLinks.douyin)
    vendors.push({ name: "Douyin", url: vendorLinks.douyin });

  await col.add({
    name: item.name,
    name_cn: item.name_cn || "",
    type: "item",
    city,
    vendors,             // MUST exist for UI
    parentId: subcategoryId,   // IMPORTANT FIX

    createdAt: Timestamp.now(),
    source: "vendor_file",
  });
}

// ----------------------
// MAIN SEEDER
// ----------------------
async function seedVendors() {
  console.log("🚀 Starting vendor import...");

  const files = fs.readdirSync(VENDORS_DIR).filter(f => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(VENDORS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const vendorName = data.vendor_name;
    const city = data.city;
    const vendorLinks = data.vendor_links;
    const menu = data.menu;

    console.log(`📌 Importing vendor: ${vendorName} (${city})`);

    // --------------------------
    // 1) Loop each menu group
    // example: chicken_burgers, sides, drinks...
    // --------------------------
    for (const subCategoryName of Object.keys(menu)) {
      const items = menu[subCategoryName];

      // Items have master category in "category"
      const mainCategoryName = items[0].category;

      // --------------------------
      // Create category + subcategory
      // --------------------------
      const mainCatId = await ensureRootCategory(mainCategoryName, city);
      const subCatId = await ensureSubcategory(subCategoryName, mainCatId, city);

      // --------------------------
      // Create items assigned to subcategory
      // --------------------------
      for (const item of items) {
        await insertItem(item, city, vendorLinks, subCatId);
        console.log(`   → Added item: ${item.name}`);
      }
    }
  }

  console.log("✅ Vendor seeding completed!");
}

seedVendors().catch(err => console.error("❌ Error:", err));
