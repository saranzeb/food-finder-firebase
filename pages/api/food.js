import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// These variables are provided by the canvas environment
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const __app_id = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig, __app_id);
const db = getFirestore(app);

export default async function handler(req, res) {
    try {
        const { method, query: reqQuery } = req;

        if (method === 'GET') {
            const listType = reqQuery.list;
            const categoryName = reqQuery.category;
            const subcategoryName = reqQuery.subcategory;

            // Fetch all top-level categories
            if (listType === 'categories') {
                const q = query(collection(db, "foodNodes"), where("type", "==", "category"), where("parentId", "==", null));
                const querySnapshot = await getDocs(q);
                const categories = querySnapshot.docs.map(doc => doc.data().name);
                return res.status(200).json(categories);
            }

            // Fetch subcategories for a given category name
            if (categoryName && listType === 'subcategories') {
                // First, find the parent category's document
                const categoryQuery = query(collection(db, "foodNodes"), where("name", "==", categoryName), where("parentId", "==", null));
                const categoryDocs = await getDocs(categoryQuery);

                if (!categoryDocs.empty) {
                    const categoryId = categoryDocs.docs[0].id;
                    const subcategoryQuery = query(collection(db, "foodNodes"), where("parentId", "==", categoryId));
                    const subcategoryDocs = await getDocs(subcategoryQuery);
                    const subcategories = subcategoryDocs.docs.map(doc => doc.data().name);
                    return res.status(200).json(subcategories);
                }
                return res.status(404).json({ error: "Category not found." });
            }

            // Fetch food items for a given subcategory
            if (categoryName && subcategoryName) {
                // First, find the parent category's document ID
                const categoryQuery = query(collection(db, "foodNodes"), where("name", "==", categoryName), where("parentId", "==", null));
                const categoryDocs = await getDocs(categoryQuery);

                if (categoryDocs.empty) {
                    return res.status(404).json({ error: "Category not found." });
                }
                const categoryId = categoryDocs.docs[0].id;

                // Then, find the subcategory's document ID within that category
                const subcategoryQuery = query(collection(db, "foodNodes"), where("name", "==", subcategoryName), where("parentId", "==", categoryId));
                const subcategoryDocs = await getDocs(subcategoryQuery);

                if (!subcategoryDocs.empty) {
                    const subcategoryId = subcategoryDocs.docs[0].id;
                    // Finally, get the items under that subcategory
                    const itemsQuery = query(collection(db, "foodNodes"), where("type", "==", "item"), where("parentId", "==", subcategoryId));
                    const itemsDocs = await getDocs(itemsQuery);
                    const items = itemsDocs.docs.map(doc => ({ name: doc.data().name, url: doc.data().url }));
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
