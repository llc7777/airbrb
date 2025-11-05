import axios from "axios";

const API_URL = `http://localhost:5005`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (email, password, name) => {
    return api.post("/user/auth/register", { email, password, name });
  },
  login: (email, password) => {
    return api.post("/user/auth/login", { email, password });
  },
};

export default api;
