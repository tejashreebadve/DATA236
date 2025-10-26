// src/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import PropertyCard from "../components/PropertyCard";

// ---------- helpers (adapted to your schema) ----------
function toDate(d){ return d ? new Date(d) : null; }
function norm(s=""){ return s.normalize("NFKD").replace(/\p{Diacritic}/gu,"").toLowerCase(); }
function words(s=""){ return norm(s).split(/\s+/).filter(Boolean); }

// Match against fields you actually return: name, location, country, description
function matchesLocation(listing, query){
  if (!query) return true;
  const hay = norm([
    listing.name,
    listing.location,
    listing.country,
    listing.description
  ].filter(Boolean).join(" "));
  return words(query).every(w => hay.includes(w));
}

// Availability: the API doesn’t provide dates yet; keep this tolerant.
// If a listing has optional fields (availableStart/availableEnd/bookedRanges),
// this will honor them; otherwise it returns true.
function withinAvailability(listing, start, end){
  if (!start && !end) return true;

  const s = toDate(start) || toDate(end);
  const e = toDate(end)   || toDate(start);
  if (!s || !e) return true;

  if (listing.availableStart && listing.availableEnd){
    const aS = new Date(listing.availableStart);
    const aE = new Date(listing.availableEnd);
    if (s < aS || e > aE) return false;
  }
  if (Array.isArray(listing.bookedRanges)){
    const overlaps = listing.bookedRanges.some(r=>{
      const bS = new Date(r.start);
      const bE = new Date(r.end);
      return s <= bE && e >= bS;
    });
    if (overlaps) return false;
  }
  return true;
}

// Guests -> max_guests (your schema)
function supportsGuests(listing, guests){
  if (!guests) return true;
  const cap = Number(listing.max_guests ?? 0);
  return cap ? guests <= cap : true;
}

// ---------- page ----------
export default function Search(){
  const [sp] = useSearchParams();
  const [all, setAll] = useState([]);

  // Fetch ALL properties once; filter client-side
  useEffect(() => {
    (async () => {
      try {
        // IMPORTANT: this calls /api/properties/search (via your axios baseURL)
        const { data } = await api.get("/properties/search", { params: {} });
        setAll(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load properties:", err);
        setAll([]);
      }
    })();
  }, []);

  const query = {
    location: sp.get("location") || "",
    start:    sp.get("start") || "",
    end:      sp.get("end") || "",
    guests:   Number(sp.get("guests") || 0),
  };

  const items = useMemo(() => {
    return all.filter((l) =>
      matchesLocation(l, query.location) &&
      withinAvailability(l, query.start, query.end) &&
      supportsGuests(l, query.guests)
    );
  }, [all, query.location, query.start, query.end, query.guests]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Search results</h1>

      <div className="text-sm text-black/60 mb-3">
        Showing {items.length} stays
        {query.location && <> • in “{query.location}”</>}
        {query.start && query.end && <> • {query.start} → {query.end}</>}
        {query.guests > 0 && <> • {query.guests} guests</>}
      </div>

      {items.length === 0 && (
        <p className="text-textSecondary">No stays match your filters.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((it) => (
          <Link key={it.id} to={`/property/${it.id}`}>
            <PropertyCard item={it} />
          </Link>
        ))}
      </div>
    </main>
  );
}