import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store";

export default function Signup(){
  const [role,setRole] = useState("TRAVELER");
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [location,setLocation] = useState("");
  const [err,setErr] = useState("");
  const navigate = useNavigate();
  const signup = useAuth(s=>s.signup)

  async function submit(e){
    e.preventDefault();
    try {
      await signup({ role, name, email, password, location });
      navigate('/');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Signup failed');
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={submit} className="space-y-3">
        <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border border-borderSubtle rounded-xl px-3 py-2">
          <option value="TRAVELER">Traveler</option>
          <option value="OWNER">Owner</option>
        </select>
        <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}
          className="w-full border border-borderSubtle rounded-xl px-3 py-2"/>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          className="w-full border border-borderSubtle rounded-xl px-3 py-2"/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}
          className="w-full border border-borderSubtle rounded-xl px-3 py-2"/>
        {role === 'OWNER' && (
          <input placeholder="Your city/area" value={location} onChange={e=>setLocation(e.target.value)}
            className="w-full border border-borderSubtle rounded-xl px-3 py-2"/>
        )}
        <button className="w-full bg-brand text-white rounded-xl px-4 py-2">Sign up</button>
      </form>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </main>
  );
}
