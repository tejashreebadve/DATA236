import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import PropertyCard from "../components/PropertyCard";

export default function Search(){
  const [sp] = useSearchParams();
  const [items, setItems] = useState([]);

  useEffect(()=>{ (async()=>{
    const params = Object.fromEntries(sp.entries());
    const { data } = await api.get("/properties/search", { params });
    setItems(data);
  })(); },[sp]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">Search results</h1>
      {items.length === 0 && <p className="text-textSecondary">No stays match your filters.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map(it => <a key={it.id} href={`/property/${it.id}`}><PropertyCard item={it}/></a>)}
      </div>
    </main>
  );
}
