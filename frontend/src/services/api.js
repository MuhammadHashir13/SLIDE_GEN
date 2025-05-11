import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getCurrentUser: () => api.get("/auth/me"),
};

// Slides API calls
export const slidesAPI = {
  generate: (data) => api.post("/slides/generate", data),
  uploadImage: (formData) =>
    api.post("/slides/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

// Decks API calls
export const decksAPI = {
  getAll: () => api.get("/decks"),
  getOne: (id) => api.get(`/decks/${id}`),
  create: (deckData) => api.post("/decks", deckData),
  update: (id, deckData) => api.put(`/decks/${id}`, deckData),
  delete: (id) => api.delete(`/decks/${id}`),
  exportPDF: (id) => {
    return api.get(`/decks/${id}/export`, {
      responseType: "blob",
    });
  },
};

// Upload API calls
export const uploadAPI = {
  uploadImage: (formData) =>
    api.post("/slides/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  uploadMultipleImages: (formData) =>
    api.post("/upload/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

export default api;
