// src/store.js
import { create } from "zustand";
import { api } from "./api";

/** AUTH STORE */
export const useAuth = create((set, get) => ({
  user: null,

  async me() {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data?.user ?? null });
    } catch {
      set({ user: null }); // never throw
    }
  },

  async login(email, password) {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      set({ user: data?.user ?? null });
      return { ok: true, user: data?.user ?? null };
    } catch (e) {
      const msg = e?.response?.data?.error || "Login failed";
      return { ok: false, error: msg };
    }
  },

  async logout() {
    try { await api.post("/auth/logout"); } catch {}
    set({ user: null });
  },
}));

/** FAVORITES STORE */
export const useFav = create((set, get) => ({
  loaded: false,
  ids: [],

  async load() {
    // idempotent
    if (get().loaded) return;
    try {
      const { data } = await api.get("/favorites");
      // accept either [{property_id:1}, ...] or [1,2,3]
      const list = Array.isArray(data) ? data : [];
      const ids = list.map((x) => (typeof x === "number" ? x : x.property_id)).filter(Boolean);
      set({ ids, loaded: true });
    } catch {
      set({ loaded: true }); // never throw
    }
  },

  async toggle(propertyId) {
    // optimistic toggle
    const has = get().ids.includes(propertyId);
    set({ ids: has ? get().ids.filter((id) => id !== propertyId) : [...get().ids, propertyId] });

    try {
      // Prefer POST to add, DELETE to remove; adjust if your backend uses a different shape.
      if (has) {
        await api.delete(`/favorites/${propertyId}`);
      } else {
        await api.post(`/favorites/${propertyId}`);
      }
    } catch {
      // revert on failure
      set({ ids: get().ids });
    }
  },
}));
