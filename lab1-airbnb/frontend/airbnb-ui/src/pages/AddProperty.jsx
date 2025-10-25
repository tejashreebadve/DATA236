// src/pages/AddProperty.jsx
import { useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

export default function AddProperty() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    type: "",
    category: "",
    location: "",
    country: "",
    description: "",
    amenities: [],
    price_per_night: "",
    bedrooms: "",
    bathrooms: "",
    max_guests: ""
  });

  const [msg, setMsg] = useState("");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleAmenityChange(e) {
    const val = e.target.value;
    const isChecked = e.target.checked;
    let updated = [...form.amenities];
    if (isChecked) updated.push(val);
    else updated = updated.filter((a) => a !== val);
    setForm({ ...form, amenities: updated });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...form };
      payload.amenities = form.amenities || [];
      await api.post("/owners/properties", payload);
      navigate("/owner");
    } catch (err) {
      console.error("Add failed", err);
      setMsg("Failed to add property");
    }
  }

  function handleCancel() {
    navigate("/owner");
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Add Property</h1>
      {msg && <p className="text-red-600 mb-4">{msg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Property Name" className="w-full border p-2 rounded" required />
        <input name="type" value={form.type} onChange={handleChange} placeholder="Type" className="w-full border p-2 rounded" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="w-full border p-2 rounded" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="w-full border p-2 rounded" required />
        <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="w-full border p-2 rounded" />
        <textarea name="description" value={form.description || ''} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded h-24" />

        <div>
          <label className="block font-medium mb-1">Amenities:</label>
          <div className="flex flex-wrap gap-3">
            {["WiFi", "TV", "Kitchen", "Air Conditioning", "Parking"].map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input type="checkbox" value={a} checked={form.amenities.includes(a)} onChange={handleAmenityChange} />
                <span>{a}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="price_per_night" value={form.price_per_night} onChange={handleChange} placeholder="Price per Night" className="border p-2 rounded" required />
          <input name="bedrooms" value={form.bedrooms} onChange={handleChange} placeholder="Bedrooms" className="border p-2 rounded" />
          <input name="bathrooms" value={form.bathrooms} onChange={handleChange} placeholder="Bathrooms" className="border p-2 rounded" />
          <input name="max_guests" value={form.max_guests} onChange={handleChange} placeholder="Max Guests" className="border p-2 rounded" required />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">Submit Property</button>
          <button type="button" onClick={handleCancel} className="bg-gray-200 text-black px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </main>
  );
}
