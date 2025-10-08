// seed.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // path to your downloaded JSON

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  try {
    await db.collection("foodCategories").add({
      name: "Burgers",
      subcategories: [
        {
          name: "Cheeseburgers",
          items: [
            {
              name: "McDonald's Cheeseburger",
              url: "https://www.mcdonalds.com/menu/cheeseburger",
            },
            {
              name: "Burger King Whopper",
              url: "https://www.bk.com/menu/whopper",
            },
          ],
        },
        {
          name: "Special Burgers",
          items: [
            {
              name: "Wendy's Baconator",
              url: "https://www.wendys.com/baconator",
            },
            {
              name: "Five Guys Bacon Cheeseburger",
              url: "https://www.fiveguys.com/menu/burger",
            },
          ],
        },
      ],
    });
    console.log("✅ Data seeded successfully");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error adding document: ", e);
    process.exit(1);
  }
}

seedData();
