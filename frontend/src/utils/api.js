import axios from "axios";

const API_URL = `http://localhost:5005`;

const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
authApi.interceptors.request.use(
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
    return publicApi.post("/user/auth/register", { email, password, name });
  },
  login: (email, password) => {
    return publicApi.post("/user/auth/login", { email, password });
  },
  logout: () => {
    return authApi.post("/user/auth/logout");
  },
};

export const listingsAPI = {
  getAllListings: () => {
    return publicApi.get("/listings");
  },
  getListingById: (listingId) => {
    return publicApi.get("/listings/${listingid}");
  },
};

export default api;
