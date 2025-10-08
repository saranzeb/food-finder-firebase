"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to remove duplicates by name
  const uniqueByName = (arr) =>
    arr.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.name ? t.name === item.name : t === item)
    );

  // Load categories
  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/food?list=categories");
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        const data = await res.json();
        setCategories([...new Set(data)]); // dedupe categories
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please check your API.");
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Category click
  const handleCategoryClick = async (catName) => {
    setSelectedCategory(catName);
    setSelectedSubcategory(null);
    setResults([]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/food?category=${encodeURIComponent(catName)}&list=subcategories`);
      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
      const data = await res.json();
      setSubcategories([...new Set(data)]); // dedupe subcategories
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setError("Failed to load subcategories. Please check your API.");
    } finally {
      setLoading(false);
    }
  };

  // Subcategory click
  const handleSubcategoryClick = async (subName) => {
    setSelectedSubcategory(subName);
    setResults([]);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/food?category=${encodeURIComponent(selectedCategory)}&subcategory=${encodeURIComponent(subName)}`);
      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
      const data = await res.json();
      setResults(uniqueByName(data)); // dedupe items by name
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to load items. Please check your API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold text-blue-800 mb-6 tracking-wide">Food Finder</h1>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Explore categories, subcategories, and dishes — data powered by Firebase + your API.
        </p>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && <div className="text-xl font-medium text-gray-500 my-8">Loading...</div>}

        {/* Categories */}
        {!loading && (
          <div className="flex flex-col items-center">
            <div className="w-full">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Choose a Category:</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {categories.length > 0 ? (
                  categories.map((cat, i) => (
                    <button
                      key={i}
                      onClick={() => handleCategoryClick(cat)}
                      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-blue-200 text-blue-800 hover:bg-blue-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-500">No categories found.</p>
                )}
              </div>
            </div>

            {/* Subcategories */}
            {selectedCategory && (
              <div className="w-full mt-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Choose a Subcategory:</h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {subcategories.map((sub, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubcategoryClick(sub)}
                      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedSubcategory === sub
                          ? "bg-green-600 text-white shadow-lg"
                          : "bg-green-200 text-green-800 hover:bg-green-300"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {results.length > 0 && (
              <div className="w-full mt-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Results:</h2>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="grid gap-4">
                    {results.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 flex justify-between items-center"
                      >
                        <span className="text-blue-600 font-medium hover:underline">{r.name}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
