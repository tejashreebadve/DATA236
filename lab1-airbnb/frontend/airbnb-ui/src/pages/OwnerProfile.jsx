// src/pages/OwnerProfile.jsx
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

export default function OwnerProfile() {
  const [form, setForm] = useState({});
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/owners/me/profile");
        setForm(data);
        setAvatar(toAbsoluteUrl(data.avatar));
      } catch {
        setMsg("Failed to load profile.");
      }
    })();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.put("/owners/me/profile", form);
      setMsg("Profile updated successfully.");
      setEditing(false);
    } catch {
      setMsg("Update failed.");
    }
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/profile/avatar", fd);
      setAvatar(toAbsoluteUrl(data.avatar || ""));
    } catch {
      alert("Upload failed.");
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Owner Profile</h1>
        {!editing ? (
          <button
            className="border px-4 py-1 rounded"
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </button>
        ) : (
          <div className="space-x-2">
            <button
              className="border px-4 py-1 rounded bg-black text-white"
              type="submit"
              onClick={handleSubmit}
            >
              Save
            </button>
            <button
              className="border px-4 py-1 rounded"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {msg && <p className="text-blue-600 mb-4">{msg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={avatar || "/placeholder.jpg"}
            alt="avatar"
            className="h-20 w-20 object-cover rounded-full border"
          />
          {editing && (
            <label className="text-sm text-gray-600">
              <span className="block">Upload new picture</span>
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>
          )}
        </div>

        <input
          name="name"
          value={form.name || ""}
          onChange={handleChange}
          placeholder="Full Name"
          disabled={!editing}
          className="w-full border p-2 rounded"
        />
        <input
          name="email"
          value={form.email || ""}
          onChange={handleChange}
          placeholder="Email"
          disabled={!editing}
          className="w-full border p-2 rounded"
        />
        <input
          name="location"
          value={form.location || ""}
          onChange={handleChange}
          placeholder="Business Location"
          disabled={!editing}
          className="w-full border p-2 rounded"
        />
      </form>
    </main>
  );
}
