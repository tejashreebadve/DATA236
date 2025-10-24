import { useEffect, useState } from "react";
import { api } from "../api";
import { COUNTRIES } from "../utils/countries";
import { US_STATES } from "../utils/usStates";

export default function TravelerProfile(){
  const [p,setP] = useState({});
  const [msg,setMsg] = useState("");

  useEffect(()=>{ (async()=>{
    const { data } = await api.get('/traveler/profile');
    setP(data || {});
  })(); },[]);

  async function save(){
    await api.put('/traveler/profile', p);
    setMsg("Profile saved");
  }

  async function upload(e){
    const f = e.target.files[0]; if(!f) return;
    const fd = new FormData(); fd.append('image', f);
    const { data } = await api.post('/upload/profile', fd, { headers: { 'Content-Type':'multipart/form-data' }});
    setP(prev => ({ ...prev, profile_image_url: data.url }));
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-3">
      <h1 className="text-2xl font-semibold">Traveler Profile</h1>
      <div className="grid gap-3">
        <input placeholder="Phone" value={p.phone||''} onChange={e=>setP({...p, phone:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2"/>
        <textarea placeholder="About me" value={p.about_me||''} onChange={e=>setP({...p, about_me:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2"/>
        <select value={p.country||''} onChange={e=>setP({...p, country:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2">
          <option value="">Select country</option>
          {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="City" value={p.city||''} onChange={e=>setP({...p, city:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2"/>
        <select value={p.state_abbr||''} onChange={e=>setP({...p, state_abbr:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2">
          <option value="">State (2-letter)</option>
          {US_STATES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Languages (comma separated)" value={p.languages||''} onChange={e=>setP({...p, languages:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2"/>
        <input placeholder="Gender" value={p.gender||''} onChange={e=>setP({...p, gender:e.target.value})}
          className="border border-borderSubtle rounded-xl px-3 py-2"/>
        <div className="flex items-center gap-3">
          {p.profile_image_url && <img src={`http://localhost:8000${p.profile_image_url}`} alt="Profile" className="h-16 w-16 rounded-full object-cover border"/>}
          <input type="file" onChange={upload}/>
        </div>
        <button onClick={save} className="bg-brand text-white rounded-xl px-4 py-2 w-fit">Save</button>
        {msg && <p className="text-green-700 text-sm">{msg}</p>}
      </div>
    </main>
  );
}
