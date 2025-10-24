import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function PropertyDetails(){
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [start,setStart] = useState(""); const [end,setEnd] = useState(""); const [guests,setGuests]=useState(2);
  const [msg,setMsg] = useState("");

  useEffect(()=>{ (async()=>{
    const { data } = await api.get(`/properties/${id}`);
    setP(data);
  })(); },[id]);

  async function book(){
    setMsg("");
    const { data } = await api.post("/bookings",{ property_id: id, start_date: start, end_date: end, guests });
    setMsg(`Booking created with status ${data.status || 'PENDING'}`);
  }

  async function fav(){
    await api.post(`/favorites/${id}`);
    setMsg("Added to favorites");
  }

  if (!p) return <main className="mx-auto max-w-5xl px-4 py-6">Loading...</main>

  const img = p.images?.[0]?.url || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format";

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid md:grid-cols-2 gap-6">
        <img src={img} alt={p.name} className="w-full rounded-xl object-cover"/>
        <div>
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <p className="text-textSecondary">{p.location}</p>
          <p className="mt-2">{p.description}</p>
          <p className="mt-4 font-medium">${Number(p.price_per_night).toFixed(0)} / night</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <input type="date" value={start} onChange={e=>setStart(e.target.value)}
              className="border border-borderSubtle rounded-xl px-3 py-2"/>
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)}
              className="border border-borderSubtle rounded-xl px-3 py-2"/>
            <input type="number" min={1} value={guests} onChange={e=>setGuests(+e.target.value)}
              className="border border-borderSubtle rounded-xl px-3 py-2"/>
            <button onClick={book} className="bg-brand text-white rounded-xl px-4 py-2">Book</button>
            <button onClick={fav} className="border rounded-xl px-4 py-2">❤️ Favorite</button>
          </div>

          {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
        </div>
      </div>
    </main>
  );
}
