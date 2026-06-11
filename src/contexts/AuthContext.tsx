import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthContextValue {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  roles: string[]
  isAdmin: boolean
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>
  signOut: () => Promise<void>
  resetPassword: (email: string) => ReturnType<typeof supabase.auth.resetPasswordForEmail>
  updatePassword: (password: string) => ReturnType<typeof supabase.auth.updateUser>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchRoles(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId)
  if (!data) return []
  return data.map((r) => (r.roles as unknown as { name: string } | null)?.name ?? '')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const updateRoles = useCallback(async (userId: string | null) => {
    setRoles(userId ? await fetchRoles(userId) : [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      await updateRoles(u?.id ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user ?? null
      setUser(u)
      updateRoles(u?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [updateRoles])

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    roles,
    isAdmin: roles.includes('admin'),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: async () => { await supabase.auth.signOut() },
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
