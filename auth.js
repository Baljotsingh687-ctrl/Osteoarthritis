const TOKEN_KEY = 'oaSathiAuthToken'
const USER_KEY = 'oaSathiAuthUser'
const PROFILE_KEY = 'oaSathiAuthProfile'
const TYPE_KEY = 'oaSathiAccountType'

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function getAuthUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null } }
export function getAuthProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null } }
export function getAccountType() { return localStorage.getItem(TYPE_KEY) }
export function setAuthSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token)
  if (data.user) localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  if (data.profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile))
  if (data.account_type) localStorage.setItem(TYPE_KEY, data.account_type)
}
export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); localStorage.removeItem(PROFILE_KEY); localStorage.removeItem(TYPE_KEY)
  localStorage.removeItem('oaSathiPatientId')
}
export function isAuthenticated() { return !!getToken() }
