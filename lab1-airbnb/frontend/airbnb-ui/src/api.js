import axios from "axios";

/* ------------------------------------------------------------
 * Global API client (core backend routes)
 * ---------------------------------------------------------- */
export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

// Public routes (no auth redirect on 401)
const publicPaths = ["/", "/property", "/search", "/login", "/signup"];

// Redirect to /login on 401 for protected routes
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isUnauthorized = err?.response?.status === 401;
    const path = window.location.pathname;
    const isPublic = publicPaths.some((prefix) => path.startsWith(prefix));

    if (isUnauthorized && !isPublic) {
      console.warn("🔒 Redirecting to login due to 401 on protected route:", path);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------
 * AI Agent API (via backend proxy → FastAPI Agent)
 * Reuse the same client so baseURL = http://localhost:8000/api
 * ---------------------------------------------------------- */
const agentClient = api;

/**
 * Anonymous/general chat (no login required)
 * @param {string} question
 * @returns {Promise<{answer:string}>}
 */
export function agentChat(question) {
  return agentClient.post("/agent/chat", { question }).then((r) => r.data);
}

/**
 * Fetch upcoming bookings for the logged-in user
 * Requires session cookie
 * @returns {Promise<{bookings: Array}>}
 */
export function agentBookings() {
  return agentClient.get("/agent/bookings").then((r) => r.data);
}

/**
 * Generate itinerary for a selected booking + preferences + free-text ask
 * @param {{
 *   booking: { id?:number, location:string, start:string, end:string, partyType:string, guests:number },
 *   preferences: { budget?:"$"|"$$"|"$$$"|"$$$$", interests?:string[], mobility?:"none"|"wheelchair"|"limited", diet?:string|null },
 *   ask?: string
 * }} payload
 * @returns {Promise<{
 *   itinerary: Array<{date:string,morning:any[],afternoon:any[],evening:any[]}>,
 *   activities: any[], restaurants: any[], packing: string[]
 * }>}
 */
export function agentPlan(payload) {
  return agentClient.post("/agent/plan", payload).then((r) => r.data);
}