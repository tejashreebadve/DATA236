import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
});

// redirect to login on 401, but don't clear state here
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // only redirect if we're hitting a protected page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const agentApi = axios.create({
  baseURL: 'http://localhost:9000',
});
