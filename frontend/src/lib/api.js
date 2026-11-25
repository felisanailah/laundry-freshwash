import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fw_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('fw_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuthSession(token, user) {
  localStorage.setItem('fw_token', token)
  localStorage.setItem('fw_user', JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem('fw_token')
  localStorage.removeItem('fw_user')
}

export default api
