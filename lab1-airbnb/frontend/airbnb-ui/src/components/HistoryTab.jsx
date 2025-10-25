// HistoryTab.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

export default function HistoryTab() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/bookings/mine").then(({ data }) => setHistory(data || []));
  }, []);

  if (!history.length) return <p className="text-gray-500">You have no trips yet.</p>;

  return (
    <div className="space-y-4">
      {history.map(b => (
        <div key={b.id} className="border rounded-xl p-4 bg-white">
          <div className="font-semibold">{b.property_name}</div>
          <div className="text-sm text-gray-600">
            {b.start_date} to {b.end_date} · {b.guests} guests
          </div>
          <div className="text-sm text-blue-700 font-medium mt-1">
            Status: {b.status}
          </div>
        </div>
      ))}
    </div>
  );
}
