// FavoritesTab.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import { useFav } from "../store";
import { Link } from "react-router-dom";

export default function FavoritesTab() {
  const [items, setItems] = useState([]);
  const fav = useFav();

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/favorites/mine");
      setItems(data || []);
      if (!fav.loaded) await fav.load();
    })();
  }, []);

  async function remove(id) {
    const confirmRemove = window.confirm("Are you sure you want to remove this from favourites?");
    if (!confirmRemove) return;

    try {
      await fav.remove(id);
      setItems(prev => prev.filter(p => p.id !== id));
      showToast("Removed from favourites.");
    } catch (e) {
      console.error("Failed to remove favourite", e);
      showToast("Failed to remove. Please try again.", true);
    }
  }

  function showToast(msg, isError = false) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow ${
      isError ? "bg-red-600 text-white" : "bg-green-600 text-white"
    } z-50 text-sm`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  if (!items.length) return <p className="text-gray-500">You have no favorites.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map(p => (
        <div key={p.id} className="border rounded-xl p-3 bg-white">
          <img
            src={p.image_url || "/placeholder.jpg"}
            className="h-40 w-full object-cover rounded-md"
            alt=""
          />
          <div className="mt-2 font-semibold">{p.name}</div>
          <div className="text-sm text-gray-600">{p.location}</div>
          <div className="text-sm text-gray-700">${p.price_per_night} / night</div>
          <div className="mt-2 flex justify-between items-center">
            <Link
              to={`/property/${p.id}`}
              className="text-sm text-blue-600 underline"
            >
              View Property
            </Link>
            <button
              onClick={() => remove(p.id)}
              className="text-sm text-red-600 underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
