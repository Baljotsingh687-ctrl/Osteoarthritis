import { getToken, clearAuthSession } from './auth.js'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, '')

export async function apiFetch(path, options = {}) {
  if (!API_BASE_URL) throw new Error('VITE_API_BASE_URL is not configured')
  const { auth = true, ...fetchOptions } = options
  const token = getToken()
  if (auth && !token) throw new Error('Please sign in first')

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(isFormData ? {} : options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers || {})
  }
  if (!auth) delete headers.Authorization

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...fetchOptions, headers })
  } catch (err) {
    throw new Error('Cannot reach OA Sathi backend at ' + API_BASE_URL + '. Start the backend and PostgreSQL, then try again.')
  }
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) clearAuthSession()
  if (!response.ok) throw new Error(body.error || body.detail || `API request failed: ${response.status}`)
  return body
}

export { API_BASE_URL }
