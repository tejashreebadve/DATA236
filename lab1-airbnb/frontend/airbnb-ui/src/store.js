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
      set({ user: null });
    }
  },

  async signup(payload) {
    try {
      const res = await api.post("/auth/signup", payload);
      const user = res?.data?.user || null;
      set({ user });
      return user ? { ok: true, user } : { ok: false, error: "No user in response" };
    } catch (e) {
      const msg = e?.response?.data?.error || "Signup failed";
      return { ok: false, error: msg };
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
    if (get().loaded) return;
    try {
      const { data } = await api.get("/favorites/mine");  // ✅ fixed path
      const ids = Array.isArray(data) ? data.map((p) => p.id || p.property_id) : [];
      set({ ids, loaded: true });
    } catch (e) {
      console.error("Failed to load favorites", e);
      set({ loaded: true });
    }
  },

  async add(propertyId) {
    try {
      await api.post(`/favorites/${propertyId}`);
      set((state) => ({
        ids: [...state.ids, propertyId],
      }));
    } catch (e) {
      console.error("Failed to add favorite", e);
    }
  },

  async remove(propertyId) {
    try {
      await api.delete(`/favorites/${propertyId}`);
      set((state) => ({
        ids: state.ids.filter((id) => id !== propertyId),
      }));
    } catch (e) {
      console.error("Failed to remove favorite", e);
      throw e;
    }
  },

  async toggle(propertyId) {
    const has = get().ids.includes(propertyId);
    try {
      if (has) {
        await get().remove(propertyId);
      } else {
        await get().add(propertyId);
      }
    } catch (e) {
      console.error("Toggle favorite failed", e);
    }
  },
}));
