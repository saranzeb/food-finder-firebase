// seed.js (CommonJS) - run locally with `node seed.js`
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Find existing node with same name + parentId
 */
async function findNode(name, parentRef) {
  let query = db.collection("foodNodes").where("name", "==", name);
  if (parentRef) {
    query = query.where("parentId", "==", parentRef.id);
  } else {
    query = query.where("parentId", "==", null);
  }
  const snap = await query.get();
  return snap.empty ? null : snap.docs[0];
}

/**
 * Create or reuse a node
 */
async function createNode(name, parentRef = null, type = "category", meta = {}) {
  const existing = await findNode(name, parentRef);
  if (existing) {
    console.log(`⚠️ Skipping duplicate: ${name} (already exists)`);
    return existing.ref; // reuse existing doc
  }

  const docRef = db.collection("foodNodes").doc();
  let parentPath = "";

  if (parentRef) {
    const parentDoc = await parentRef.get();
    if (!parentDoc.exists) {
      throw new Error(`Parent with ID ${parentRef.id} not found.`);
    }
    parentPath = parentDoc.data().path + ".";
  }

  const newNode = {
    name,
    parentId: parentRef ? parentRef.id : null,
    path: parentPath + docRef.id,
    type,
    ...meta,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(newNode);
  console.log(`✅ Created ${type}: ${name} with ID: ${docRef.id}`);
  return docRef;
}

/**
 * Cleanup duplicates (run manually if needed)
 */
async function cleanupDuplicates() {
  console.log("🧹 Cleaning duplicates...");
  const snap = await db.collection("foodNodes").get();
  const seen = new Map();

  for (const doc of snap.docs) {
    const { name, parentId } = doc.data();
    const key = `${name}_${parentId || "root"}`;
    if (seen.has(key)) {
      console.log(`🗑️ Deleting duplicate: ${name} (${doc.id})`);
      await doc.ref.delete();
    } else {
      seen.set(key, doc.id);
    }
  }
  console.log("✅ Cleanup done.");
}

/**
 * Seeding data
 */
async function seed() {
  try {
    console.log("🌱 Seeding start...");

    // Top-Level Categories
    const fastFoods = await createNode("Fast Foods");
    const drinksBeverages = await createNode("Drinks & Beverages");
    const southAsianCuisine = await createNode("South Asian Cuisine");
    const eastAsianCuisine = await createNode("East Asian Cuisine");
    const westernFoods = await createNode("Western Foods");
    const arabicFoods = await createNode("Arabic Foods");
    const chineseFoods = await createNode("Chinese Foods");

    // Fast Foods Hierarchy
    const burgers = await createNode("Burgers", fastFoods);
    const cheeseburgers = await createNode("Cheeseburgers", burgers);
    await createNode("Cheeseburger", cheeseburgers, "item", {
      vendors: [
        { name: "McDonald's", url: "https://www.mcdonalds.com/cheeseburger" },
        { name: "Burger King", url: "https://www.bk.com/whopper" },
      ],
    });

    // Drinks & Beverages
    const softDrinks = await createNode("Soft Drinks", drinksBeverages);
    await createNode("Cola", softDrinks, "item", {
      vendors: [
        { name: "Coca-Cola", url: "https://www.coca-cola.com" },
        { name: "Pepsi", url: "https://www.pepsi.com" },
      ],
    });

    const coffee = await createNode("Coffee", drinksBeverages);
    await createNode("Espresso", coffee, "item", {
      vendors: [
        { name: "Starbucks", url: "https://www.starbucks.com/menu/product/espresso" },
        { name: "Costa Coffee", url: "https://www.costa.co.uk/menu/espresso" },
      ],
    });

    // South Asian Cuisine
    const curries = await createNode("Curries", southAsianCuisine);
    await createNode("Butter Chicken", curries, "item", {
      vendors: [{ name: "Generic Recipe", url: "https://example.com/butter-chicken" }],
    });
    await createNode("Chicken Tikka Masala", curries, "item", {
      vendors: [{ name: "Generic Recipe", url: "https://example.com/tikka-masala" }],
    });

    // Western Foods
    const desserts = await createNode("Desserts", westernFoods);
    const pastries = await createNode("Pastries", desserts);
    const danishes = await createNode("Danishes", pastries);
    await createNode("Cinnamon Swirl Danish", danishes, "item", {
      vendors: [{ name: "Bakery", url: "https://example.com/cinnamon-danish" }],
    });

    // Arabic Foods
    await createNode("Hummus", arabicFoods, "item", {
      vendors: [{ name: "Generic Recipe", url: "https://example.com/hummus" }],
    });
    await createNode("Falafel", arabicFoods, "item", {
      vendors: [{ name: "Generic Recipe", url: "https://example.com/falafel" }],
    });

    console.log("🎉 Seeding finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

// Run seed
seed();
// Uncomment if you want to clean duplicates:
// cleanupDuplicates();
