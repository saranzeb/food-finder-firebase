"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, ArrowLeft, Save, Plus, Globe } from "lucide-react";

// Shape of a search result
const emptySearchResult = {
  name: null,
  category: null,
  subcategory: null,
  vendors: [],
  source: null, // "database" | "ai"
};

export default function HomePage() {
  // ---------------- STATE ----------------
  const [view, setView] = useState("browse"); // "search" | "browse"

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(emptySearchResult);
  const [searchLoading, setSearchLoading] = useState(false);

  // Browse state
  const [browseLoading, setBrowseLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);    // full doc
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // full doc

  // Banner message
  const [banner, setBanner] = useState("");

  const showBanner = (msg, ms = 3000) => {
    setBanner(msg);
    if (ms) {
      setTimeout(() => setBanner(""), ms);
    }
  };

  // ---------------- BROWSE HELPERS ----------------

  const loadCategories = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const res = await fetch("/api/browse?listType=categories");
      const data = await res.json();
      setCategories(data || []);
      setSubcategories([]);
      setItems([]);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } catch (e) {
      console.error("loadCategories error", e);
      showBanner("❌ Failed to load categories", 4000);
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  const loadSubcategories = useCallback(async (categoryDoc) => {
    if (!categoryDoc) return;
    setBrowseLoading(true);
    try {
      const res = await fetch(
        `/api/browse?listType=subcategories&parentId=${categoryDoc.id}`
      );
      const data = await res.json();
      setSubcategories(data || []);
      setItems([]);
    } catch (e) {
      console.error("loadSubcategories error", e);
      showBanner("❌ Failed to load subcategories", 4000);
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  const loadItems = useCallback(async (subcategoryDoc) => {
    if (!subcategoryDoc) return;
    setBrowseLoading(true);
    try {
      const res = await fetch(
        `/api/browse?listType=items&parentId=${subcategoryDoc.id}`
      );
      const data = await res.json();
      setItems(data || []);
    } catch (e) {
      console.error("loadItems error", e);
      showBanner("❌ Failed to load items", 4000);
    } finally {
      setBrowseLoading(false);
    }
  }, []);

  // Load categories first time we enter Browse
  useEffect(() => {
    if (view === "browse" && categories.length === 0) {
      loadCategories();
    }
  }, [view, categories.length, loadCategories]);

  // ---------------- SEARCH HANDLERS ----------------

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    setSearchResult(emptySearchResult);
    showBanner("");

    try {
      const res = await fetch(
        `/api/search?foodName=${encodeURIComponent(searchTerm.trim())}`
      );
      const data = await res.json();

      if (!res.ok || !data.result) {
        showBanner(`No result for "${searchTerm}"`, 4000);
        return;
      }

      setSearchResult(data.result);
      showBanner(
        data.source === "database"
          ? `Found "${data.result.name}" in database`
          : `Found "${data.result.name}" via AI (not yet in DB)`,
        4000
      );
    } catch (err) {
      console.error("Search error", err);
      showBanner("❌ Search failed (network / API issue)", 5000);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveFromSearch = async () => {
    if (searchResult.source !== "ai" || !searchResult.name) return;

    setSearchLoading(true);
    showBanner("Saving item to database...");

    try {
      const payload = {
        name: searchResult.name,
        category: searchResult.category,
        subcategory: searchResult.subcategory,
        // use first vendor URL as main URL if present
        url: searchResult.vendors?.[0]?.url || null,
      };

      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      showBanner(`✅ Saved "${data.name || searchResult.name}"`, 4000);

      // Optionally refresh browse tree
      if (view === "browse") {
        loadCategories();
      }
    } catch (err) {
      console.error("Save-from-search error", err);
      showBanner("❌ Could not save item", 5000);
    } finally {
      setSearchLoading(false);
    }
  };

  // ---------------- BROWSE CLICK HANDLERS ----------------

  const onCategoryClick = (cat) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    loadSubcategories(cat);
  };

  const onSubcategoryClick = (sub) => {
    setSelectedSubcategory(sub);
    loadItems(sub);
  };

  const onBackInBrowse = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setItems([]);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSubcategories([]);
      setItems([]);
    }
  };

  const onBrowseHome = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubcategories([]);
    setItems([]);
    loadCategories();
  };

  // ---------------- RENDER HELPERS ----------------

  const renderSearchView = () => (
    <div className="space-y-6">
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row gap-3 items-stretch"
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Search any food item or cuisine... e.g. "Margherita Pizza"'
          className="flex-1 rounded-full border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={searchLoading}
        />
        <button
          type="submit"
          className="rounded-full bg-indigo-600 text-white px-6 py-3 flex items-center justify-center text-sm font-semibold disabled:bg-indigo-300"
          disabled={searchLoading}
        >
          {searchLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" /> Search
            </>
          )}
        </button>
      </form>

      {searchResult.name && (
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{searchResult.name}</h2>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                searchResult.source === "database"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {searchResult.source === "database"
                ? "From Database"
                : "From AI"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <p>
              <span className="font-semibold">Category:</span>{" "}
              {searchResult.category}
            </p>
            <p>
              <span className="font-semibold">Subcategory:</span>{" "}
              {searchResult.subcategory}
            </p>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-semibold mb-1">Vendors</p>
            {searchResult.vendors?.length ? (
              <ul className="space-y-1 text-sm">
                {searchResult.vendors.map((v, idx) => (
                  <li key={idx}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      {v.name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">
                No vendor links found.
              </p>
            )}
          </div>

          {searchResult.source === "ai" && (
            <button
              onClick={handleSaveFromSearch}
              className="mt-4 w-full rounded-xl bg-green-500 text-white py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-green-300"
              disabled={searchLoading}
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save to Database
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderBrowseView = () => (
    <div className="space-y-6">
      {/* Breadcrumb / header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {(selectedCategory || selectedSubcategory) && (
            <button
              onClick={onBackInBrowse}
              className="rounded-full border px-3 py-1 text-xs flex items-center gap-1 hover:bg-gray-50"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
          )}
          <h2 className="text-lg font-semibold">
            {selectedSubcategory
              ? `${selectedCategory.name} › ${selectedSubcategory.name}`
              : selectedCategory
              ? selectedCategory.name
              : "Categories"}
          </h2>
        </div>
        <button
          onClick={onBrowseHome}
          className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50"
        >
          Home
        </button>
      </div>

      {browseLoading && (
        <p className="text-sm text-gray-500 mb-2">Loading...</p>
      )}

      <div className="space-y-3">
        {/* Categories */}
        {!selectedCategory &&
          categories.map((cat) => (
            <button
              key={cat.id}
              className="w-full text-left bg-white border rounded-xl px-4 py-3 hover:border-indigo-400 transition"
              onClick={() => onCategoryClick(cat)}
            >
              {cat.name}
            </button>
          ))}

        {/* Subcategories */}
        {selectedCategory &&
          !selectedSubcategory &&
          subcategories.map((sub) => (
            <button
              key={sub.id}
              className="w-full text-left bg-white border rounded-xl px-4 py-3 hover:border-indigo-400 transition"
              onClick={() => onSubcategoryClick(sub)}
            >
              {sub.name}
            </button>
          ))}

        {/* Items (3rd level) */}
        {selectedSubcategory &&
          items.map((item) => {
            // IMPORTANT: support both item.url and item.vendors[0].url (seed.js)
            const itemUrl =
              item.url ||
              (Array.isArray(item.vendors) && item.vendors[0]?.url) ||
              null;

            const content = (
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.name}</span>
                {itemUrl && (
                  <span className="text-xs text-indigo-600 mt-1 flex items-center">
                    <Globe className="w-3 h-3 mr-1" />
                    Source link
                  </span>
                )}
              </div>
            );

            return itemUrl ? (
              <a
                key={item.id}
                href={itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-white border rounded-xl px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50 transition"
              >
                {content}
              </a>
            ) : (
              <div
                key={item.id}
                className="w-full bg-white border rounded-xl px-4 py-3"
              >
                {content}
              </div>
            );
          })}
      </div>
    </div>
  );

  // ---------------- MAIN RENDER ----------------

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Food Finder</h1>
          <a
            href="/add"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> Manual Add
          </a>
        </div>

        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
          <button
            onClick={() => setView("search")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              view === "search"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setView("browse")}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              view === "browse"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Browse
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {banner && (
          <div
            className={`mb-4 rounded-xl px-4 py-2 text-sm font-medium ${
              banner.startsWith("✅")
                ? "bg-green-100 text-green-800"
                : banner.startsWith("❌")
                ? "bg-red-100 text-red-800"
                : "bg-indigo-100 text-indigo-800"
            }`}
          >
            {banner}
          </div>
        )}

        {view === "search" ? renderSearchView() : renderBrowseView()}
      </main>
    </div>
  );
}
