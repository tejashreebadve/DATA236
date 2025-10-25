import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true,
});

// Optional: define which routes are public
const publicPaths = [
  "/",             // homepage
  "/property",     // property detail
  "/search",
  "/login",
  "/signup"
];

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
