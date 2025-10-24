import { useEffect, useState } from "react";
import { api } from "../api";

export default function OwnerProfile(){
  const [p,setP] = useState({});

  useEffect(()=>{ (async()=>{
    const { data } = await api.get('/owner/profile');
    setP(data || {});
  })(); },[]);

  async function save(){
    await api.put('/owner/profile', p);
    alert("Profile saved")
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-3">
      <h1 className="text-2xl font-semibold">Owner Profile</h1>
      <input placeholder="Location" value={p.location||''} onChange={e=>setP({...p, location:e.target.value})}
        className="border border-borderSubtle rounded-xl px-3 py-2"/>
      <input placeholder="Contact info" value={p.contact_info||''} onChange={e=>setP({...p, contact_info:e.target.value})}
        className="border border-borderSubtle rounded-xl px-3 py-2"/>
      <button onClick={save} className="bg-brand text-white rounded-xl px-4 py-2 w-fit">Save</button>
    </main>
  );
}
