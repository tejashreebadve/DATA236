import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth, useFav } from "../store";
import PropertyCard from "../components/PropertyCard";
import FilterChips from "../components/FilterChips";

export default function Home() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [params, setParams] = useSearchParams();
  const me = useAuth(s => s.me);
  const fav = useFav();

  useEffect(() => {
    me();
    fav.load(); // fav.load() works even if user is null (internally handles it)
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
        setItems(data || []);
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
    <div className="mx-auto max-w-7xl">
      <FilterChips active={active} onChange={handleChipChange} />
      <div className="px-4 py-6">
        {items.length === 0 && (
          <div className="text-black/60">No listings for this filter.</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(it => (
            <a key={it.id} href={`/property/${it.id}`}>
              <PropertyCard item={it} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
