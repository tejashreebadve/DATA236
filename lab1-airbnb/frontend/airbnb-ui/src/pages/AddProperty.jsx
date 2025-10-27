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

  const [files, setFiles] = useState([]);       // selected images
  const [previews, setPreviews] = useState([]); // local preview URLs
  const [msg, setMsg] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(-1);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleAmenityChange(e) {
    const val = e.target.value;
    const checked = e.target.checked;
    setForm((f) => {
      const arr = Array.isArray(f.amenities) ? [...f.amenities] : [];
      return {
        ...f,
        amenities: checked ? Array.from(new Set([...arr, val])) : arr.filter((x) => x !== val),
      };
    });
  }

  function handleFiles(e) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    // previews
    const urls = list.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(""); setSubmitting(true);

    try {
      // 1) create
      const payload = {
        ...form,
        amenities: Array.isArray(form.amenities) ? form.amenities : [],
        price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        max_guests: form.max_guests ? Number(form.max_guests) : null,
      };
      const { data } = await api.post("/owners/properties", payload);
      const propertyId = data?.propertyId;
      if (!propertyId) throw new Error("Missing propertyId");

      // 2) upload each file
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file); // <-- field name must be 'file'
        await api.post(`/owners/properties/${propertyId}/images`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      navigate("/owner", { state: { tab: "properties" } });
    } catch (err) {
      console.error("AddProperty failed:", err?.response?.data || err);
      setMsg("Failed to add property or upload images.");
    } finally {
      setSubmitting(false);
    }
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
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded h-24" />

        <div>
          <label className="block font-medium mb-1">Amenities</label>
          <div className="flex flex-wrap gap-3">
            {["WiFi", "TV", "Kitchen", "Air Conditioning", "Parking"].map((a) => (
              <label key={a} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={a}
                  checked={(form.amenities || []).includes(a)}
                  onChange={handleAmenityChange}
                />
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
              placeholder="Bedrooms"
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
              placeholder="Bathrooms"
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
              placeholder="Max Guests"
              className="border p-2 rounded mt-1"
              required
            />
          </label>
        </div>

        {/* NEW: image upload field */}
        <div>
          <label className="block font-medium mb-1">Property Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white hover:file:bg-gray-800"
          />
          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {previews.map((src, i) => (
                <img key={i} src={src} alt={`preview-${i}`} className="h-24 w-full object-cover rounded border" />
              ))}
            </div>
          )}
          {uploadingIndex >= 0 && (
            <p className="text-sm text-gray-600 mt-2">Uploading image {uploadingIndex + 1} of {files.length}…</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Create Property"}
          </button>
          <button type="button" onClick={() => navigate("/owner")} className="bg-gray-200 text-black px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}