import { useEffect, useState } from "react";
import { api } from "../api";

const API_BASE =
  (api?.defaults?.baseURL ? String(api.defaults.baseURL) : "") ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL)
    : "") ||
  (typeof window !== "undefined" ? window.location.origin : "");

/**
 * Returns an absolute URL for a given path `p`.
 * - If `p` is already absolute, return as-is.
 * - If `p` starts with "/uploads" or "uploads", join with the **origin** of API_BASE
 *   (so it doesn't inherit "/api" or other path segments).
 * - Otherwise, join `p` against API_BASE normally.
 */
function toAbsoluteUrl(p) {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  const raw = String(p);
  const rel = raw.replace(/^\/+/, ""); // strip leading slashes

  // Derive origin (protocol + host) from API_BASE safely
  let origin = "";
  let baseForJoin = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
  try {
    const u = new URL(baseForJoin);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    // If API_BASE isn't a full URL, fall back to current origin
    if (typeof window !== "undefined") {
      origin = window.location.origin;
    }
  }

  // If it's an uploads path, always serve from root /uploads on the API origin.
  if (rel.startsWith("uploads/")) {
    return `${origin}/${rel}`;
  }

  // Otherwise, join against full API_BASE (which may include /api)
  try {
    // Ensure API_BASE ends with a slash so URL joining works predictably
    const base = API_BASE?.endsWith("/") ? API_BASE : `${API_BASE}/`;
    console.log(base);
    return new URL(rel, base).toString();
  } catch {
    // Last-ditch safe join
    const base = (API_BASE || origin || "").replace(/\/+$/, "");
    return `${base}/${rel}`;
  }
}

const countries = ["USA", "Canada", "India", "Germany", "France", "UK"];
const states = ["CA", "NY", "TX", "WA", "FL", "ON", "MH", "DL"];

export default function TravelerProfile() {
  const [form, setForm] = useState({});
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function fetchProfile() {
    try {
      const { data } = await api.get("/profile/me");
      console.log(data);
      setForm(data || {});
      setAvatar(toAbsoluteUrl(data.avatar || ""));
    } catch {
      setErr("❌ Failed to load profile.");
    }
  }

  useEffect(() => { fetchProfile(); }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      await api.put("/profile/me", form);
      setMsg("✅ Profile updated successfully.");
      fetchProfile();
    } catch (e) {
      console.error("UPDATE FAILED:", e?.response?.data || e);
      setErr("❌ Update failed. Please check logs.");
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/profile/avatar", fd);
      setAvatar(toAbsoluteUrl(data.avatar));
      setMsg("✅ Profile picture updated.");
    } catch {
      setErr("❌ Image upload failed.");
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      {msg && <p className="mb-4 text-green-600">{msg}</p>}
      {err && <p className="mb-4 text-red-600">{err}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={toAbsoluteUrl(avatar) || "/placeholder.jpg"}
            alt="avatar"
            className="h-20 w-20 object-cover rounded-full border"
          />
          <label className="text-sm text-gray-600">
            <span className="block">Upload new picture</span>
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Name" className="border p-2 rounded" />
          <input name="email" value={form.email || ""} disabled className="border p-2 rounded bg-gray-100" />
          <input name="phone" value={form.phone || ""} onChange={handleChange} placeholder="Phone" className="border p-2 rounded" />
          <input name="city" value={form.city || ""} onChange={handleChange} placeholder="City" className="border p-2 rounded" />
          <select name="state" value={form.state || ""} onChange={handleChange} className="border p-2 rounded">
            <option value="">State</option>
            {states.map(s => <option key={s}>{s}</option>)}
          </select>
          <select name="country" value={form.country || ""} onChange={handleChange} className="border p-2 rounded">
            <option value="">Country</option>
            {countries.map(c => <option key={c}>{c}</option>)}
          </select>
          <input name="languages" value={form.languages || ""} onChange={handleChange} placeholder="Languages" className="border p-2 rounded col-span-2" />
          <input name="gender" value={form.gender || ""} onChange={handleChange} placeholder="Gender" className="border p-2 rounded col-span-2" />
        </div>

        <textarea
          name="about"
          value={form.about || ""}
          onChange={handleChange}
          placeholder="About me"
          className="border p-2 rounded w-full h-24"
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}
