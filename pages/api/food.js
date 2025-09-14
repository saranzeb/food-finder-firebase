import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// Build Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    const { method, query: reqQuery } = req;

    if (method === "GET") {
      const listType = reqQuery.list;
      const categoryName = reqQuery.category;
      const subcategoryName = reqQuery.subcategory;

      // Fetch all top-level categories
      if (listType === "categories") {
        const q = query(
          collection(db, "foodNodes"),
          where("type", "==", "category"),
          where("parentId", "==", null)
        );
        const querySnapshot = await getDocs(q);
        const categories = [
          ...new Set(querySnapshot.docs.map((doc) => doc.data().name))
        ];
        return res.status(200).json(categories);
      }

      // Fetch subcategories for a given category name
      if (categoryName && listType === "subcategories") {
        const categoryQuery = query(
          collection(db, "foodNodes"),
          where("name", "==", categoryName),
          where("parentId", "==", null)
        );
        const categoryDocs = await getDocs(categoryQuery);

        if (!categoryDocs.empty) {
          const categoryId = categoryDocs.docs[0].id;
          const subcategoryQuery = query(
            collection(db, "foodNodes"),
            where("parentId", "==", categoryId)
          );
          const subcategoryDocs = await getDocs(subcategoryQuery);
          const subcategories = [
            ...new Set(subcategoryDocs.docs.map((doc) => doc.data().name))
          ];
          return res.status(200).json(subcategories);
        }
        return res.status(404).json({ error: "Category not found." });
      }

      // Fetch food items for a given subcategory
      if (categoryName && subcategoryName) {
        const categoryQuery = query(
          collection(db, "foodNodes"),
          where("name", "==", categoryName),
          where("parentId", "==", null)
        );
        const categoryDocs = await getDocs(categoryQuery);

        if (categoryDocs.empty) {
          return res.status(404).json({ error: "Category not found." });
        }
        const categoryId = categoryDocs.docs[0].id;

        const subcategoryQuery = query(
          collection(db, "foodNodes"),
          where("name", "==", subcategoryName),
          where("parentId", "==", categoryId)
        );
        const subcategoryDocs = await getDocs(subcategoryQuery);

        if (!subcategoryDocs.empty) {
          const subcategoryId = subcategoryDocs.docs[0].id;
          const itemsQuery = query(
            collection(db, "foodNodes"),
            where("type", "==", "item"),
            where("parentId", "==", subcategoryId)
          );
          const itemsDocs = await getDocs(itemsQuery);

          // Deduplicate items by (name + url)
          const items = [
            ...new Set(
              itemsDocs.docs.map((doc) =>
                JSON.stringify({
                  name: doc.data().name,
                  url: doc.data().url,
                })
              )
            ),
          ].map((s) => JSON.parse(s));

          return res.status(200).json(items);
        }
        return res.status(404).json({ error: "Subcategory not found." });
      }
    }

    res.status(405).json({ error: "Method not allowed." });
  } catch (e) {
    console.error("API Error:", e);
    res.status(500).json({ error: "Internal Server Error." });
  }
}
