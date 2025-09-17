import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Role = 'admin' | 'cashier'

export type User = {
  id: string
  name: string
  role: Role
}

type SignInPayload = {
  name: string
  role: Role
}

type AuthCtx = {
  user: User | null
  signIn: (payload: SignInPayload) => void
  signOut: () => void
}

const STORAGE_KEY = 'flowsuite-auth-user@1'
const AuthContext = createContext<AuthCtx | null>(null)

function loadStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch (error) {
    console.warn('Unable to load auth user', error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser())

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Unable to persist auth user', error)
    }
  }, [user])

  const api = useMemo<AuthCtx>(() => ({
    user,
    signIn: ({ name, role }) => {
      const trimmed = name.trim()
      const next: User = {
        id: crypto.randomUUID(),
        name: trimmed || (role === 'admin' ? 'Administrator' : 'Cashier'),
        role,
      }
      setUser(next)
    },
    signOut: () => setUser(null),
  }), [user])

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

