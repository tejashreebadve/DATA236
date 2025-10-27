import { useEffect, useState } from "react";
import { api } from "../api";
import { useNavigate, useParams } from "react-router-dom";

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        if (data.amenities && typeof data.amenities === "string") {
          data.amenities = JSON.parse(data.amenities);
        }
        setForm(data);
      } catch {
        setMsg("Failed to load property.");
      }
    })();
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleAmenityChange(e) {
    const val = e.target.value;
    const isChecked = e.target.checked;
    let updated = [...(form.amenities || [])];
    if (isChecked) updated.push(val);
    else updated = updated.filter((a) => a !== val);
    setForm({ ...form, amenities: updated });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.put(`/owners/properties/${id}`, form);
      navigate('/owner', { state: { tab: "properties" } });;
    } catch (err) {
      setMsg("Failed to update property");
    }
  }

  function handleCancel() {
    navigate("/owner");
  }

  if (!form) return <p className="p-4">Loading property...</p>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Edit Property</h1>
      {msg && <p className="text-red-600 mb-4">{msg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Property Name" className="w-full border p-2 rounded" required />
        <input name="type" value={form.type} onChange={handleChange} placeholder="Type" className="w-full border p-2 rounded" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="w-full border p-2 rounded" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="w-full border p-2 rounded" required />
        <input name="country" value={form.country} onChange={handleChange} placeholder="Country" className="w-full border p-2 rounded" />
        <textarea name="description" value={form.description || ""} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded h-24" />

        <div>
          <label className="block font-medium mb-1">Amenities:</label>
          <div className="flex flex-wrap gap-3">
            {["WiFi", "TV", "Kitchen", "Air Conditioning", "Parking"].map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input type="checkbox" value={a} checked={(form.amenities || []).includes(a)} onChange={handleAmenityChange} />
                <span>{a}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Price per Night
            <input
              type="number"
              name="price_per_night"
              value={form.price_per_night}
              onChange={handleChange}
              placeholder="Enter price per night"
              className="border p-2 rounded mt-1"
              required
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Bedrooms
            <input
              type="number"
              name="bedrooms"
              value={form.bedrooms}
              onChange={handleChange}
              placeholder="Enter number of bedrooms"
              className="border p-2 rounded mt-1"
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Bathrooms
            <input
              type="number"
              name="bathrooms"
              value={form.bathrooms}
              onChange={handleChange}
              placeholder="Enter number of bathrooms"
              className="border p-2 rounded mt-1"
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Max Guests
            <input
              type="number"
              name="max_guests"
              value={form.max_guests}
              onChange={handleChange}
              placeholder="Enter maximum guests"
              className="border p-2 rounded mt-1"
              required
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-black text-white px-4 py-2 rounded">Update Property</button>
          <button type="button" onClick={handleCancel} className="bg-gray-200 text-black px-4 py-2 rounded">Cancel</button>
        </div>
      </form>
    </main>
  );
}
