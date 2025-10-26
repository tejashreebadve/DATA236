// src/components/SearchModal.jsx
import { useState } from "react";

const btn = "px-4 py-2 rounded-full border border-black/30 bg-white text-black hover:border-black transition";
const btnPrimary = "px-5 py-2 rounded-full border border-black bg-black text-white hover:bg-neutral-900 transition";

export default function SearchModal({ open, onClose, onSearch }) {
  const [location, setLocation] = useState("");
  const [start, setStart]       = useState("");
  const [end, setEnd]           = useState("");
  const [guests, setGuests]     = useState(2);

  if (!open) return null;

  const handleSubmit = () => {
    onSearch({
      location: location.trim(),
      start: start || "",
      end: end || "",
      guests: Math.max(1, Number(guests) || 1),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start md:items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">Search stays</h2>
          <button onClick={onClose} aria-label="Close search" className={btn}>✕</button>
        </div>

        <div className="grid md:grid-cols-4 gap-3 p-4">
          <div className="md:col-span-2">
            <label className="text-sm text-black/60">Location</label>
            <input value={location} onChange={e=>setLocation(e.target.value)}
              placeholder="Where to?" className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black"/>
          </div>
          <div>
            <label className="text-sm text-black/60">Check in</label>
            <input type="date" value={start} onChange={e=>setStart(e.target.value)}
              className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black"/>
          </div>
          <div>
            <label className="text-sm text-black/60">Check out</label>
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)}
              className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black"/>
          </div>
          <div className="md:col-span-4">
            <label className="text-sm text-black/60">Guests</label>
            <input type="number" min={1} value={guests} onChange={e=>setGuests(+e.target.value)}
              className="w-full border border-black/30 rounded-xl px-3 py-2 bg-white text-black"/>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className={btn}>Cancel</button>
          <button onClick={handleSubmit} className={btnPrimary}>Search</button>
        </div>
      </div>
    </div>
  );
}