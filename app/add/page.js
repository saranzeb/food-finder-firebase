'use client';
import { useState } from 'react';

export default function AddPage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Adding...');

    try {
      const res = await fetch('/api/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, subcategory }),
      });

      if (!res.ok) throw new Error('Failed to add food');
      const data = await res.json();
      setMessage(`✅ Added: ${data.name || name}`);
      setName('');
      setCategory('');
      setSubcategory('');
    } catch (err) {
      setMessage('❌ Error adding food');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Add New Food</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10, maxWidth: 400 }}>
        <input placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
        <input placeholder="Subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <p>{message}</p>
    </div>
  );
}