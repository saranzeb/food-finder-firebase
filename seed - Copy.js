// seed.js
require("dotenv").config({ path: ".env.local" });

const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// Firebase config (loaded from .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  try {
    await addDoc(collection(db, "foodCategories"), {
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
