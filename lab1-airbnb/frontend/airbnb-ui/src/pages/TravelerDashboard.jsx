// src/pages/TravelerDashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

import FavoritesTab from "../components/FavoritesTab";
import HistoryTab from "../components/HistoryTab";

export default function TravelerDashboard() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [avatar, setAvatar] = useState("");
  const [msg, setMsg] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState("profile");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/profile/me");
        setProfile(data);
        setForm(data);
        setAvatar(data.avatar || "");
      } catch (e) {
        console.error("Failed to load traveler profile", e);
      }
    })();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put("/profile/me", form);
      setMsg("Profile updated successfully.");
      setEditMode(false);
    } catch (e) {
      setMsg("Update failed.");
    }
  };

  const handleCancel = () => {
    setForm(profile);
    setEditMode(false);
    setMsg("");
  };

  const handleFile = async (e) => {
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
  };

  const tabs = [
    { key: "profile", label: "Profile Info" },
    { key: "favorites", label: "Favourites" },
    { key: "history", label: "Booking History" }
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Traveler Dashboard</h1>

      <div className="flex gap-4 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full border ${
              tab === t.key ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && profile && (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {msg && <p className="text-blue-600">{msg}</p>}

          {!editMode && (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update Profile
            </button>
          )}

          <div className="flex items-center gap-4">
            <img
              src={avatar || "/placeholder.jpg"}
              alt="avatar"
              className="h-20 w-20 object-cover rounded-full border"
            />
            {editMode && (
              <label className="text-sm text-gray-600">
                <span className="block">Upload new picture</span>
                <input type="file" accept="image/*" onChange={handleFile} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input name="name" value={form.name || ""} placeholder="Name" className="border p-2 rounded bg-gray-100" disabled />
            <input name="email" value={form.email || ""} placeholder="Email" className="border p-2 rounded bg-gray-100" disabled />
            <input name="phone" value={form.phone || ""} onChange={handleChange} placeholder="Phone" className="border p-2 rounded" disabled={!editMode} />
            <input name="city" value={form.city || ""} onChange={handleChange} placeholder="City" className="border p-2 rounded" disabled={!editMode} />
            <input name="state" value={form.state || ""} onChange={handleChange} placeholder="State (abbreviation)" className="border p-2 rounded" disabled={!editMode} />
            <select name="country" value={form.country || ""} onChange={handleChange} className="border p-2 rounded" disabled={!editMode}>
              <option value="">Country</option>
              {["USA","Canada","India","Germany","France","UK"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input name="languages" value={form.languages || ""} onChange={handleChange} placeholder="Languages" className="border p-2 rounded col-span-2" disabled={!editMode} />
            <input name="gender" value={form.gender || ""} onChange={handleChange} placeholder="Gender" className="border p-2 rounded col-span-2" disabled={!editMode} />
          </div>

          <textarea name="about" value={form.about || ""} onChange={handleChange} placeholder="About me" className="border p-2 rounded w-full h-24" disabled={!editMode} />

          {editMode && (
            <div className="flex gap-4">
              <button type="submit" className="bg-black text-white px-4 py-2 rounded">
                Save Changes
              </button>
              <button type="button" onClick={handleCancel} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          )}
        </form>
      )}

      {tab === "favorites" && <FavoritesTab />}
      {tab === "history" && <HistoryTab />}
    </main>
  );
}
