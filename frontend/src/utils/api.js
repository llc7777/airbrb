import axios from "axios";

// Backend API base URL
const API_URL = `http://localhost:5005`;

/**
 * publicApi - Axios instance for public endpoints (no authorization required)
 * Used for: login, register, get listings, etc.
 */
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * authApi - Axios instance for protected endpoints (authorization required)
 * Used for: logout, create listing, update listing, etc.
 */
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor for authApi
 * Automatically adds Authorization header with token from localStorage
 */
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

/**
 * Authentication API endpoints
 */
export const authAPI = {
  // Register new user (no auth required)
  register: (email, password, name) => {
    return publicApi.post("/user/auth/register", { email, password, name });
  },
  // Login user (no auth required)
  login: (email, password) => {
    return publicApi.post("/user/auth/login", { email, password });
  },
  // Logout user (auth required)
  logout: () => {
    return authApi.post("/user/auth/logout");
  },
};

/**
 * Listings API endpoints
 */
export const listingsAPI = {
  // Get all listings (no auth required)
  getAllListings: () => {
    return publicApi.get("/listings");
  },
  // Get listing by ID (no auth required)
  getListingById: (listingId) => {
    return publicApi.get(`/listings/${listingId}`);
  },
  // Create new listing (auth required)
  createListing: (title, address, price, thumbnail, metadata) => {
    return authApi.post("/listings/new", {
      title,
      address,
      price,
      thumbnail,
      metadata,
    });
  },
  // Delete listing by ID (auth required)
  deleteListing: (listingId) => {
    return authApi.delete(`/listings/${listingId}`);
  },
  // Update listing by ID (auth required)
  updateListing: (listingId, title, address, price, thumbnail, metadata) => {
    return authApi.put(`/listings/${listingId}`, {
      title,
      address,
      price,
      thumbnail,
      metadata,
    });
  },
  // Publish listing (auth required)
  publishListing: (listingId, availability) => {
    return authApi.put(`/listings/publish/${listingId}`, {
      availability,
    });
  },
  // Unpublish listing (auth required)
  unpublishListing: (listingId) => {
    return authApi.put(`/listings/unpublish/${listingId}`);
  },
  // Leave a review for a listing (auth required)
  leaveReview: (listingId, bookingId, review) => {
    return authApi.put(`/listings/${listingId}/review/${bookingId}`, {
      review,
    });
  },
};

/**
 * Bookings API endpoints
 */
export const bookingsAPI = {
  // Get all bookings (auth required)
  getAllBookings: () => {
    return authApi.get("/bookings");
  },
  // Create new booking (auth required)
  createBooking: (listingId, dateRange, totalPrice) => {
    return authApi.post(`/bookings/new/${listingId}`, {
      dateRange,
      totalPrice,
    });
  },
};

export default authApi;
