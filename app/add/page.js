"use client";

import { useState } from "react";

const DEFAULT_CITY = "Beijing";

export default function AddPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorUrl, setVendorUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!name || !category || !subcategory) {
      setError("Name, category and subcategory are required.");
      return;
    }

    const vendors = [];
    if (vendorName || vendorUrl) {
      vendors.push({
        name: vendorName || "Vendor",
        url: vendorUrl || ""
      });
    }

    const payload = {
      name,
      category,
      subcategory,
      city: DEFAULT_CITY,
      vendors
    };

    try {
      const res = await fetch("/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to add item");
      }

      setMessage("Item added successfully!");
      setName("");
      setCategory("");
      setSubcategory("");
      setVendorName("");
      setVendorUrl("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error adding item");
    }
  }

  return (
    <main style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h1>Add Food Item (Beijing)</h1>
      <p style={{ fontSize: "0.9rem", color: "#555" }}>
        City is fixed to <strong>{DEFAULT_CITY}</strong> for now.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}
      >
        <label>
          Name*
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "0.4rem" }}
          />
        </label>

        <label>
          Category* (e.g. Burgers, Chicken, Sides)
          <input
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={{ width: "100%", padding: "0.4rem" }}
          />
        </label>

        <label>
          Subcategory* (e.g. burgers, chicken_items, drinks)
          <input
            type="text"
            value={subcategory}
            onChange={e => setSubcategory(e.target.value)}
            style={{ width: "100%", padding: "0.4rem" }}
          />
        </label>

        <label>
          Vendor Name (optional)
          <input
            type="text"
            value={vendorName}
            onChange={e => setVendorName(e.target.value)}
            style={{ width: "100%", padding: "0.4rem" }}
          />
        </label>

        <label>
          Vendor URL (optional)
          <input
            type="url"
            value={vendorUrl}
            onChange={e => setVendorUrl(e.target.value)}
            style={{ width: "100%", padding: "0.4rem" }}
          />
        </label>

        <button type="submit" style={{ marginTop: "0.5rem" }}>
          Add Item
        </button>
      </form>

      {message && (
        <div style={{ marginTop: "0.5rem", color: "green" }}>{message}</div>
      )}
      {error && (
        <div style={{ marginTop: "0.5rem", color: "red" }}>{error}</div>
      )}
    </main>
  );
}
