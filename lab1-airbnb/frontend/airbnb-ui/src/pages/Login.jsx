import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store";

export default function Login(){
  const [email,setEmail] = useState(""); const [password,setPassword] = useState("");
  const [err,setErr] = useState("");
  const navigate = useNavigate();
  const login = useAuth(s=>s.login)

  async function submit(e){
    e.preventDefault();
    try {
      await login(email,password);
      navigate('/');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Login failed');
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          className="w-full border border-borderSubtle rounded-xl px-3 py-2"/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}
          className="w-full border border-borderSubtle rounded-xl px-3 py-2"/>
        <button className="bg-black text-white rounded-xl px-4 py-2 hover:bg-neutral-900 transition">Log in</button>
      </form>
      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
    </main>
  );
}
