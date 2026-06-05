const USER_KEY = 'user'

export function getSessionUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null')
  } catch {
    clearSessionUser()
    return null
  }
}

export function setSessionUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.removeItem(USER_KEY)
}

export function clearSessionUser() {
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getSessionUserEmail() {
  return getSessionUser()?.email || ''
}
