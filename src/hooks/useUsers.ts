import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { UserItem } from '../types'

interface RoleOption {
  id: string
  name: string
}

export function useUsers() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_users')
      if (error) throw error
      if (data?.users) setUsers(data.users)
      if (data?.roles) setRoles(data.roles)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateRole = useCallback(async (userId: string, roleId: string) => {
    const { error: delErr } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (delErr) return false

    const { error: insErr } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId })
    if (insErr) return false

    await load()
    return true
  }, [load])

  const toggleBlock = useCallback(async (userId: string) => {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { userId, action: 'toggle-block' },
    })
    if (error || !data?.success) return false
    await load()
    return true
  }, [load])

  return { users, roles, loading, updateRole, toggleBlock, reload: load }
}
