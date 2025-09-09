// V2 deployment fix - API endpoint
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// These variables are provided by the canvas environment
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const __app_id = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const app = initializeApp(firebaseConfig, __app_id);
const db = getFirestore(app);

export default async function handler(req, res) {
    try {
        const { method, query } = req;

        if (method === 'GET') {
            const listType = query.list;
            const categoryName = query.category;
            const subcategoryName = query.subcategory;

            // Fetch all category names
            if (listType === 'categories') {
                const querySnapshot = await getDocs(collection(db, "foodCategories"));
                const categories = querySnapshot.docs.map(doc => doc.data().name);
                return res.status(200).json(categories);
            }

            // Fetch subcategory names for a specific category
            if (categoryName && listType === 'subcategories') {
                const categoryDocs = await getDocs(collection(db, "foodCategories"));
                const categoryDoc = categoryDocs.docs.find(doc => doc.data().name === categoryName);
                if (categoryDoc) {
                    const subcategories = categoryDoc.data().subcategories.map(sub => sub.name);
                    return res.status(200).json(subcategories);
                }
                return res.status(404).json({ error: "Category not found." });
            }

            // Fetch food items for a specific subcategory
            if (categoryName && subcategoryName) {
                const categoryDocs = await getDocs(collection(db, "foodCategories"));
                const categoryDoc = categoryDocs.docs.find(doc => doc.data().name === categoryName);
                if (categoryDoc) {
                    const subcategory = categoryDoc.data().subcategories.find(sub => sub.name === subcategoryName);
                    if (subcategory) {
                        return res.status(200).json(subcategory.items);
                    }
                    return res.status(404).json({ error: "Subcategory not found." });
                }
                return res.status(404).json({ error: "Category not found." });
            }
        }

        res.status(405).json({ error: "Method not allowed." });
    } catch (e) {
        console.error("API Error:", e);
        res.status(500).json({ error: "Internal Server Error." });
    }
}
