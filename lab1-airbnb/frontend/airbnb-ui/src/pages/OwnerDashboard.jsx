import { useEffect, useState } from "react";
import { api } from "../api";

export default function OwnerDashboard(){
  const [data,setData] = useState({ previous:[], incoming:[] });

  useEffect(()=>{ (async()=>{
    const {data} = await api.get('/dashboard/owner'); setData(data);
  })(); },[]);

  async function accept(id){
    await api.post(`/bookings/${id}/accept`);
    const {data} = await api.get('/dashboard/owner'); setData(data);
  }
  async function cancel(id){
    await api.post(`/bookings/${id}/cancel`);
    const {data} = await api.get('/dashboard/owner'); setData(data);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <section>
        <h1 className="text-2xl font-semibold mb-2">Incoming requests</h1>
        {data.incoming.length === 0 ? <p className="text-textSecondary">No pending requests.</p> :
          <ul className="space-y-2">
            {data.incoming.map(b=>(
              <li key={b.id} className="border border-borderSubtle rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{b.property_name}</div>
                  <div className="text-sm text-textSecondary">{b.start_date} → {b.end_date} · {b.guests} guests</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>accept(b.id)} className="px-3 py-1 rounded bg-green-600 text-white">Accept</button>
                  <button onClick={()=>cancel(b.id)} className="px-3 py-1 rounded border">Cancel</button>
                </div>
              </li>
            ))}
          </ul>}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Previous bookings</h2>
        {data.previous.length === 0 ? <p className="text-textSecondary">No previous bookings.</p> :
          <ul className="list-disc ml-5">
            {data.previous.map(b => <li key={b.id}>{b.property_name} — {b.start_date} → {b.end_date} — {b.status}</li>)}
          </ul>}
      </section>
    </main>
  );
}
