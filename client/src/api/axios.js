import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true
})

let accessToken = null
let isRefreshing = false
let queue = []

export function setApiToken(token) {
  accessToken = token
}

function processQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  queue = []
}

api.interceptors.request.use(config => {
  config.headers = config.headers || {}

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config

    if (!original) {
      return Promise.reject(error)
    }

    const url = original.url || ''
    const isRefreshRequest = url.includes('/auth/refresh') || url.includes('auth/refresh')
    const isLoginRequest = url.includes('/auth/login') || url.includes('auth/login')
    const isRegisterRequest = url.includes('/auth/register') || url.includes('auth/register')
    const isLogoutRequest = url.includes('/auth/logout') || url.includes('auth/logout')

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isRefreshRequest &&
      !isLoginRequest &&
      !isRegisterRequest &&
      !isLogoutRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then(token => {
          original.headers = original.headers || {}
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/auth/refresh')
        const newToken = res.data.accessToken
        accessToken = newToken
        processQueue(null, newToken)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        accessToken = null
        window.dispatchEvent(new Event('authlogout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'Недостаточно прав для этого действия'
      window.dispatchEvent(new CustomEvent('apiforbidden', { detail: { message } }))
    }

    return Promise.reject(error)
  }
)

export default api