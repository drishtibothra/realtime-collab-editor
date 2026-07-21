import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const login = (email: string, password: string) =>
  axios.post<{ access_token: string }>(`${API_BASE_URL}/auth/login`, { email, password });

export const signup = (email: string, password: string) =>
  axios.post(`${API_BASE_URL}/auth/signup`, { email, password });