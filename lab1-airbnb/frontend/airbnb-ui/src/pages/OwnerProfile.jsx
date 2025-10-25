// src/pages/OwnerProfile.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

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
        setAvatar(data.avatar || "");
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
      setAvatar(data.avatar);
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
