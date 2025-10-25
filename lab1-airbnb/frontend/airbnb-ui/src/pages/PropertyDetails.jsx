// src/pages/PropertyDetails.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useFav, useAuth } from "../store";

const btn = "px-4 py-2 rounded-full border border-black/30 bg-white text-black hover:border-black";
const btnPrimary = "px-4 py-2 rounded-full border border-black bg-black text-white hover:bg-neutral-900 transition";

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [msg, setMsg] = useState("");
  const fav = useFav();
  const user = useAuth(s => s.user);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setProperty(data);
        if (!fav.loaded) await fav.load();
      } catch (e) {
        console.error("Failed to load property", e);
      }
    })();
  }, [id]);

  async function handleBooking(e) {
    e.preventDefault();
    setMsg("");
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || !endDate || !guests) {
      setMsg("❌ All booking fields are required.");
      return;
    }
    if (start < now.setHours(0,0,0,0)) {
      setMsg("❌ Start date must be in the future.");
      return;
    }
    if (end <= start) {
      setMsg("❌ End date must be after start date.");
      return;
    }

    try {
      await api.post("/bookings", {
        propertyId: id,
        startDate,
        endDate,
        guests
      });
      setMsg("✅ Booking request submitted.");
    } catch (e) {
      console.error(e);
      setMsg("❌ Booking failed. Check dates or try again.");
    }
  }

  async function toggleFav() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    await fav.toggle(property.id);
  }

  if (!property) return <p className="p-6">Loading...</p>;

  const isFav = fav.ids.includes(Number(id));

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
      <p className="text-gray-600 mb-4">{property.location}</p>

      {property.images && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {property.images.map((url, i) => (
            <img key={i} src={url} alt="" className="w-full h-60 object-cover rounded" />
          ))}
        </div>
      )}

      <div className="space-y-2 mb-6">
        <p><strong>Type:</strong> {property.type}</p>
        <p><strong>Category:</strong> {property.category}</p>
        <p><strong>Price per night:</strong> ${property.price_per_night}</p>
        <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
        <p><strong>Bathrooms:</strong> {property.bathrooms}</p>
        <p><strong>Max Guests:</strong> {property.max_guests}</p>
        <p><strong>Amenities:</strong> {property.amenities}</p>
        <button onClick={toggleFav} className={btn}>
          {isFav ? "❤️ Favorited" : "🤍 Favorite"}
        </button>
      </div>

      <form onSubmit={handleBooking} className="border-t pt-4 space-y-4">
        <h2 className="text-xl font-semibold">Book this property</h2>
        {msg && <p className="text-blue-600">{msg}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="border p-2 rounded w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Guests</label>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Guests"
            />
          </div>
        </div>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Request Booking
        </button>
      </form>
    </main>
  );
}
