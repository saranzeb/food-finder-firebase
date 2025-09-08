// seed.js (CommonJS) - run locally with `node seed.js`
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // Make sure this file exists in the same directory

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Helper function to create a node with its path
async function createNode(name, parentRef = null, type = "category", meta = {}) {
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
    ...meta, // Spread operator to include any additional meta data
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(newNode);
  console.log(`✅ Created ${type}: ${name} with ID: ${docRef.id}`);
  return docRef; // Return the DocumentReference for creating children
}

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
    await createNode("McDonald's Cheeseburger", cheeseburgers, "item", { url: "https://www.mcdonalds.com/cheeseburger" });
    await createNode("Burger King Whopper", cheeseburgers, "item", { url: "https://www.bk.com/whopper" });

    // Drinks & Beverages Hierarchy (shallow example)
    const softDrinks = await createNode("Soft Drinks", drinksBeverages);
    await createNode("Coca-Cola", softDrinks, "item", { url: "https://www.coca-cola.com" });
    await createNode("Pepsi", softDrinks, "item", { url: "https://www.pepsi.com" });
    const coffee = await createNode("Coffee", drinksBeverages);
    await createNode("Espresso", coffee, "item", { url: "https://example.com/espresso" });

    // South Asian Cuisine Hierarchy (manual entry example)
    const curries = await createNode("Curries", southAsianCuisine);
    await createNode("Butter Chicken", curries, "item", { url: "https://example.com/butter-chicken" });
    await createNode("Chicken Tikka Masala", curries, "item", { url: "https://example.com/tikka-masala" });

    // Western Foods (deep hierarchy with a manual entry)
    const desserts = await createNode("Desserts", westernFoods);
    const pastries = await createNode("Pastries", desserts);
    const danishes = await createNode("Danishes", pastries);
    await createNode("Cinnamon Swirl Danish", danishes, "item", { url: "https://example.com/cinnamon-danish" });

    // Example of a manual entry directly under a top-level category
    await createNode("Hummus", arabicFoods, "item", { url: "https://example.com/hummus" });
    await createNode("Falafel", arabicFoods, "item", { url: "https://example.com/falafel" });

    console.log("🎉 Seeding finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();