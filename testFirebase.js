// import { initializeApp } from "firebase/app";
// import { getFirestore, collection, getDocs } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// async function test() {
//   try {
//     const querySnapshot = await getDocs(collection(db, "categories"));
//     const data = querySnapshot.docs.map(doc => doc.data());
//     console.log("✅ Firebase connected. Categories:", data);
//   } catch (error) {
//     console.error("❌ Firebase connection error:", error.message);
//   }
// }

// test();
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// NOTE: This script assumes environment variables are loaded via --env-file=.env.local

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    try {
        // --- FIX: Using the correct collection 'foodNodes' and filtering logic ---
        const collectionName = "foodNodes";
        
        // This query replicates the logic in your working food.js API route:
        // 1. Target collection: "foodNodes"
        // 2. Filter by: type == "category"
        // 3. Filter by: parentId == null (top-level nodes)
        const q = query(
            collection(db, collectionName),
            where("type", "==", "category"),
            where("parentId", "==", null)
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => doc.data().name); // Only logging the names for clarity
        
        console.log(`✅ Firebase connected. Collection: ${collectionName}. Documents found: ${data.length}`);
        console.log("Categories List:", data);
        
    } catch (error) {
        // This should catch any remaining network or permission issues
        console.error("❌ Firebase connection error:", error.message);
    }
}

test();