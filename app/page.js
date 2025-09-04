"use client";

import { useEffect, useState } from "react";
import { auth, provider, db } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [results, setResults] = useState([]);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Load categories from Firestore
  useEffect(() => {
    const q = query(collection(db, "foodCategories"), orderBy("name"));
    return onSnapshot(q, snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setResults([]);
  };

  const handleSubcategoryClick = (sub) => {
    setSelectedSubcategory(sub);
    setResults(sub.items || []);
  };

  const addExampleData = async () => {
    await addDoc(collection(db, "foodCategories"), {
      name: "Fried Chicken",
      subcategories: [
        {
          name: "Spicy Chicken Sandwich",
          items: [
            { name: "Popeyes Spicy Chicken Sandwich", url: "https://www.popeyes.com/spicy-chicken-sandwich" },
            { name: "KFC Spicy Famous Bowl", url: "https://www.kfc.com/menu/bowls/spicy-famous-bowl" }
          ]
        }
      ]
    });
  };

  return (
    <main className="flex flex-col items-center min-h-screen p-8">
      {!user ? (
        <button onClick={() => signInWithPopup(auth, provider)}>Sign in with Google</button>
      ) : (
        <>
          <p>Welcome {user.displayName} <button onClick={() => signOut(auth)}>Sign out</button></p>
          <button onClick={addExampleData}>Add Example Data</button>

          <h1 className="text-3xl font-bold mt-6">Food Finder</h1>

          <div className="flex flex-wrap gap-4 mt-4">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => handleCategoryClick(cat)} className="px-4 py-2 bg-blue-200">
                {cat.name}
              </button>
            ))}
          </div>

          {selectedCategory && (
            <div className="mt-4">
              <h2>Choose subcategory</h2>
              <div className="flex flex-wrap gap-4">
                {selectedCategory.subcategories.map((sub, i) => (
                  <button key={i} onClick={() => handleSubcategoryClick(sub)} className="px-4 py-2 bg-green-200">
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 grid gap-2">
              {results.map((r, i) => (
                <a key={i} href={r.url} target="_blank" className="underline text-blue-600">{r.name}</a>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
