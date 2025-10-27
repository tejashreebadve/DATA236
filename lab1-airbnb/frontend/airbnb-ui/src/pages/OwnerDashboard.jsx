// src/pages/OwnerDashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

// Build API base (axios baseURL → VITE_API_URL → window origin)
const API_BASE =
  (api?.defaults?.baseURL ? String(api.defaults.baseURL) : "") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

/**
 * Make an absolute URL from a possibly relative path.
 * - If already absolute, return as-is.
 * - If path starts with "/uploads" or "uploads", force join against API origin (drop /api).
 * - Otherwise, join against full API_BASE (which may include /api).
 */
function toAbsoluteUrl(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  const raw = String(p);
  const rel = raw.replace(/^\/+/, ""); // strip leading slashes

  // Derive origin from API_BASE (protocol + host only)
  let origin = "";
  let baseForJoin = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  try {
    const u = new URL(baseForJoin);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    if (typeof window !== "undefined") origin = window.location.origin;
  }

  // If it's an uploads path, always serve from root /uploads on API origin (no /api).
  if (rel.startsWith("uploads/")) {
    return `${origin}/${rel}`;
  }

  // Otherwise join against full API_BASE (which might include /api)
  try {
    const base = API_BASE?.endsWith("/") ? API_BASE : `${API_BASE}/`;
    return new URL(rel, base).toString();
  } catch {
    const base = (API_BASE || origin || "").replace(/\/+$/, "");
    return `${base}/${rel}`;
  }
}

export default function OwnerDashboard() {
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/owners/me/properties").then(({ data }) => setProperties(data || []));
    api.get("/owners/me/bookings").then(({ data }) => setBookings(data || []));
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Owner Dashboard</h1>

      {/* Tab Selector */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-full border ${tab === "dashboard" ? "bg-black text-white" : "bg-white text-black"}`}
          onClick={() => setTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`px-4 py-2 rounded-full border ${tab === "properties" ? "bg-black text-white" : "bg-white text-black"}`}
          onClick={() => setTab("properties")}
        >
          Owner Properties
        </button>
      </div>

      {tab === "dashboard" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <p>Total Listings: <strong>{properties.length}</strong></p>
            <p>Total Bookings: <strong>{bookings.length}</strong></p>
          </div>

          <h2 className="text-xl font-semibold mb-2">Incoming Booking Requests</h2>
          {bookings.length === 0 && <p className="text-gray-500">No bookings yet.</p>}
          {bookings.map(b => (
            <div key={b.id} className="border rounded-xl p-4 mb-4 bg-white">
              <div className="font-semibold">{b.property_name}</div>
              <div className="text-sm text-gray-600">
                {b.traveler_name} ({b.traveler_email})<br />
                {b.start_date} to {b.end_date} · {b.guests} guests
              </div>
              <div className="mt-2 flex gap-2">
                {b.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => api.post(`/bookings/${b.id}/accept`).then(() => window.location.reload())}
                      className="bg-green-600 text-white px-4 py-1 rounded-full"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => api.post(`/bookings/${b.id}/cancel`).then(() => window.location.reload())}
                      className="bg-red-600 text-white px-4 py-1 rounded-full"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-blue-700 font-medium">Status: {b.status}</span>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "properties" && (
        <>
          <div className="flex justify-end mb-4">
            <Link to="/owner/add" className="bg-black text-white px-4 py-2 rounded">+ Add Property</Link>
          </div>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => {
              // image_url is relative like "/uploads/xxxx" from backend
              const img = toAbsoluteUrl(p.image_url || "");
              let amenitiesText = "";
              try {
                const list = Array.isArray(p.amenities) ? p.amenities : JSON.parse(p.amenities || "[]");
                amenitiesText = Array.isArray(list) ? list.join(", ") : "";
              } catch {
                amenitiesText = "";
              }

              return (
                <div key={p.id} className="border rounded-xl overflow-hidden bg-white">
                  <img
                    src={img || "/placeholder.jpg"}
                    className="h-48 w-full object-cover"
                    alt={p.name || "property image"}
                    onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
                  />
                  <div className="p-4 space-y-1">
                    <h2 className="font-semibold text-lg">{p.name}</h2>
                    <p className="text-sm text-gray-600">{p.location}</p>
                    <p className="text-sm text-gray-600">${p.price_per_night} / night</p>
                    <p className="text-sm text-gray-500">
                      {p.bedrooms} bed • {p.bathrooms} bath • max {p.max_guests} guests
                    </p>
                    <p className="text-sm text-gray-500">Type: {p.type} | Category: {p.category}</p>
                    <p className="text-xs text-gray-500">Amenities: {amenitiesText}</p>
                    <div className="flex justify-between items-center pt-2">
                      <Link to={`/property/${p.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                      <button
                        onClick={() => navigate(`/owner/edit/${p.id}`)}
                        className="text-sm text-black bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}