import axios from 'axios'

// All API requests go to the FastAPI backend
// In production this is set via VITE_API_URL environment variable on Vercel
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Automatically attach the JWT token to every request if one is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
