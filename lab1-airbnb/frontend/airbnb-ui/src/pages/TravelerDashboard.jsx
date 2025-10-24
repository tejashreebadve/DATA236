import { useEffect, useState } from "react";
import { api } from "../api";
import FloatingAgentButton from "../components/FloatingAgentButton";
import AgentSidePanel from "../components/AgentSidePanel";

export default function TravelerDashboard(){
  const [data,setData] = useState({ history:[], favorites:[] });
  const [open,setOpen] = useState(false);

  useEffect(()=>{ (async()=>{
    const {data} = await api.get('/dashboard/traveler'); setData(data);
  })(); },[]);

  const last = data.history[0];
  const bookingContext = last ? {
    location: "San Francisco",  // TODO: derive from property location
    start_date: last.start_date,
    end_date: last.end_date,
    party_type: "family",
    guests: last.guests
  } : {
    location: "San Francisco",
    start_date: "2025-11-01",
    end_date: "2025-11-03",
    party_type: "couple",
    guests: 2
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Your trips & wishlist</h1>

      <section className="mb-6">
        <h2 className="font-semibold mb-2">Past & upcoming bookings</h2>
        {data.history.length === 0 ? <p className="text-textSecondary">No bookings yet.</p> :
          <ul className="list-disc ml-5">
            {data.history.map(b => <li key={b.id}>{b.property_name} — {b.start_date} → {b.end_date} — {b.status}</li>)}
          </ul>}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Favorites</h2>
        {data.favorites.length === 0 ? <p className="text-textSecondary">No favorites yet.</p> :
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {data.favorites.map(it => <a key={it.id} href={`/property/${it.id}`} className="block"><img className="w-full rounded-xl" src={(it.images?.[0]?.url)||(it.image_url)||'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format'} alt={it.name}/><div className="mt-2">{it.name}</div></a>)}
          </div>}
      </section>

      <FloatingAgentButton onClick={()=>setOpen(true)} />
      <AgentSidePanel open={open} onClose={()=>setOpen(false)} bookingContext={bookingContext}/>
    </main>
  );
}
