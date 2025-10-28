// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth, useFav } from "../store";
import PropertyCard from "../components/PropertyCard";
import FilterChips from "../components/FilterChips";

// ===========================================================
// 🔧 API base + helper to make image URLs absolute
// ===========================================================
const API_BASE =
  (api?.defaults?.baseURL ? String(api.defaults.baseURL) : "") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

/**
 * Converts relative URLs (like "/uploads/...") to absolute URLs.
 * - Keeps absolute URLs untouched
 * - Resolves "/uploads" or "uploads" paths to the API origin
 * - Otherwise joins with API_BASE (which might include /api)
 */
function toAbsoluteUrl(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  const rel = String(p).replace(/^\/+/, "");
  let origin = "";
  let baseForJoin = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");

  try {
    const u = new URL(baseForJoin);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    if (typeof window !== "undefined") origin = window.location.origin;
  }

  if (rel.startsWith("uploads/")) {
    return `${origin}/${rel}`;
  }

  try {
    const base = API_BASE?.endsWith("/") ? API_BASE : `${API_BASE}/`;
    return new URL(rel, base).toString();
  } catch {
    const base = (API_BASE || origin || "").replace(/\/+$/, "");
    return `${base}/${rel}`;
  }
}

// ===========================================================
// 🏠 Home Page
// ===========================================================
export default function Home() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [params, setParams] = useSearchParams();
  const me = useAuth((s) => s.me);
  const fav = useFav();

  useEffect(() => {
    me();
    fav.load(); // works even if user not logged in
  }, []);

  useEffect(() => {
    const c = params.get("category");
    if (c) setActive(c);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const q = {};
        if (active) q.category = active;

        const { data } = await api.get("/properties/search", { params: q });
        const fixed = (data || []).map((d) => ({
          ...d,
          image_url: toAbsoluteUrl(d.image_url || ""),
        }));
        setItems(fixed);
      } catch (e) {
        console.error("Load listings failed", e);
        setItems([]);
      }
    })();
  }, [active]);

  function handleChipChange(key) {
    setActive(key);
    const next = new URLSearchParams(params);
    if (key) next.set("category", key);
    else next.delete("category");
    setParams(next, { replace: true });
  }

  return (
    <div className="w-full px-8">
      <FilterChips active={active} onChange={handleChipChange} />

      <div className="px-4 py-6">
        {items.length === 0 && (
          <div className="text-black/60">No listings for this filter.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((it) => (
            <a key={it.id} href={`/property/${it.id}`}>
              <PropertyCard item={it} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}