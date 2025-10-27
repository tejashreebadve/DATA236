// src/pages/TravelerDashboard.jsx
import { useState } from "react";
import FavoritesTab from "../components/FavoritesTab";
import HistoryTab from "../components/HistoryTab";

export default function TravelerDashboard() {
  const [tab, setTab] = useState("favorites");

  const tabs = [
    { key: "favorites", label: "Favourites" },
    { key: "history", label: "Booking History" }
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Traveler Dashboard</h1>

      <div className="flex gap-4 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full border ${
              tab === t.key ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "favorites" && <FavoritesTab />}
      {tab === "history" && <HistoryTab />}
    </main>
  );
}