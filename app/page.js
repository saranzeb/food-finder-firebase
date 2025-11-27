"use client";

import { useEffect, useState } from "react";

const DEFAULT_CITY = "Beijing";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchSource, setSearchSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------
  // LOAD ROOT CATEGORIES
  // -----------------------
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setError("");
      const res = await fetch(
        `/api/browse?listType=categories&city=${encodeURIComponent(
          DEFAULT_CITY
        )}`
      );
      if (!res.ok) throw new Error("Failed to load categories");

      const data = await res.json();
      setCategories(data || []);
      setSubcategories([]);
      setItems([]);
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    } catch (err) {
      console.error(err);
      setError("Error loading categories");
    }
  }

  // -----------------------
  // LOAD SUBCATEGORIES
  // -----------------------
  async function loadSubcategories(categoryId) {
    try {
      setError("");
      setSelectedCategoryId(categoryId);
      setSelectedSubcategoryId(null);
      setItems([]);

      const res = await fetch(
        `/api/browse?listType=subcategories&parentId=${encodeURIComponent(
          categoryId
        )}&city=${encodeURIComponent(DEFAULT_CITY)}`
      );

      if (!res.ok) throw new Error("Failed to load subcategories");
      const data = await res.json();
      setSubcategories(data || []);
    } catch (err) {
      console.error(err);
      setError("Error loading subcategories");
    }
  }

  // -----------------------
  // LOAD ITEMS
  // -----------------------
  async function loadItems(subcategoryId) {
    try {
      setError("");
      setSelectedSubcategoryId(subcategoryId);

      const res = await fetch(
        `/api/browse?listType=items&parentId=${encodeURIComponent(
          subcategoryId
        )}&city=${encodeURIComponent(DEFAULT_CITY)}`
      );
      if (!res.ok) throw new Error("Failed to load items");

      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setError("Error loading items");
    }
  }

  // -----------------------
  // SEARCH
  // -----------------------
  async function handleSearch(e) {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    try {
      setLoading(true);
      setError("");
      setSearchResult(null);
      setSearchSource(null);

      const res = await fetch(
        `/api/search?foodName=${encodeURIComponent(
          term
        )}&city=${encodeURIComponent(DEFAULT_CITY)}`
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();

      if (data && data.result) {
        setSearchResult(data.result);
        setSearchSource(data.source || "unknown");
      } else {
        setSearchResult(data);
        setSearchSource("unknown");
      }
    } catch (err) {
      console.error(err);
      setError("Search error");
    } finally {
      setLoading(false);
    }
  }

  // -----------------------
  // SAVE AI RESULT
  // -----------------------
  async function saveAIItem() {
    if (!searchResult) return;

    const name = searchResult.name;
    const category = searchResult.category || "Other";
    const subcategory = searchResult.subcategory || "Other";
    const vendors = Array.isArray(searchResult.vendors)
      ? searchResult.vendors
      : [];

    if (!name) {
      alert("AI result has no name. Cannot save.");
      return;
    }

    try {
      setError("");
      const payload = { name, category, subcategory, city: DEFAULT_CITY, vendors };

      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save AI item");
      }

      alert("AI item saved successfully!");

      if (selectedSubcategoryId) loadItems(selectedSubcategoryId);
    } catch (err) {
      console.error(err);
      setError("Error saving AI item");
    }
  }

  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Food Finder (Beijing)</h1>
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        City is fixed to <strong>{DEFAULT_CITY}</strong> for now.
      </p>

      {/* SEARCH */}
      <section style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search food name..."
            style={{ flex: 1, padding: "0.5rem" }}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "0.5rem", color: "red" }}>{error}</div>
        )}

        {searchResult && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px"
            }}
          >
            <h3>
              Search Result{" "}
              {searchSource && (
                <span style={{ fontSize: "0.8rem", color: "#666" }}>
                  (source: {searchSource})
                </span>
              )}
            </h3>

            <p><strong>Name:</strong> {searchResult.name}</p>
            {searchResult.category && (
              <p><strong>Category:</strong> {searchResult.category}</p>
            )}
            {searchResult.subcategory && (
              <p><strong>Subcategory:</strong> {searchResult.subcategory}</p>
            )}

            {Array.isArray(searchResult.vendors) &&
              searchResult.vendors.length > 0 && (
                <div>
                  <strong>Vendors:</strong>
                  <ul>
                    {searchResult.vendors.map((v, idx) => (
                      <li key={idx}>
                        {v.name}{" "}
                        {v.url && (
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "blue" }}
                          >
                            link
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <button onClick={saveAIItem} style={{ marginTop: "0.5rem" }}>
              Save this result to database
            </button>
          </div>
        )}
      </section>

      {/* BROWSE */}
      <section style={{ display: "flex", gap: "1rem" }}>

        {/* Categories */}
        <div style={{ flex: 1 }}>
          <h2>Categories</h2>
          <ul>
            {categories.map(cat => (
              <li key={cat.id}>
                <button
                  onClick={() => loadSubcategories(cat.id)}
                  style={{
                    background:
                      selectedCategoryId === cat.id ? "#ddd" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem 0"
                  }}
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Subcategories */}
        <div style={{ flex: 1 }}>
          <h2>Subcategories</h2>
          <ul>
            {subcategories.map(sub => (
              <li key={sub.id}>
                <button
                  onClick={() => loadItems(sub.id)}
                  style={{
                    background:
                      selectedSubcategoryId === sub.id ? "#ddd" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "0.25rem 0"
                  }}
                >
                  {sub.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Items */}
        <div style={{ flex: 1 }}>
          <h2>Items</h2>
          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  background: "#fafafa"
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                  {item.name}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {item.vendors?.map((v, i) => (
                    <a
                      key={i}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "6px 10px",
                        background: "#0070f3",
                        color: "#fff",
                        borderRadius: "4px",
                        textDecoration: "none",
                        width: "fit-content"
                      }}
                    >
                      Order on {v.name}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </section>
    </main>
  );
}
