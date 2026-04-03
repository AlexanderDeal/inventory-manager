import axios from 'axios'

// All API requests go to the FastAPI backend
const api = axios.create({
  baseURL: 'http://localhost:8000',
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
