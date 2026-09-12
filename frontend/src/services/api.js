// ============================================================
// MEDVISION AI - AXIOS API CLIENT
// ============================================================
//
// Purpose:
// This file creates a centralized Axios instance for communicating
// with the FastAPI backend.
//
// Backend:
// http://127.0.0.1:8000
//
// All authenticated requests automatically receive the JWT token
// stored in localStorage.
//
// ============================================================

import axios from "axios";

// ============================================================
// AXIOS INSTANCE
// ============================================================

const api = axios.create({
  // FastAPI backend URL
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",

  // Default response format
  headers: {
    Accept: "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
//
// Before every request:
//
// 1. Check localStorage for access_token
// 2. If token exists, attach it to Authorization header
//
// Result:
//
// Authorization: Bearer <JWT_TOKEN>
//
// This means we don't have to manually add the token
// in every API request.
//
// ============================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================
// EXPORT API CLIENT
// ============================================================

export default api;
