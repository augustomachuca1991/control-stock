import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => {
      if (data) setProfile(data as Profile)
      setLoading(false)
    })
  }, [userId])

  const update = useCallback(async (input: Partial<Omit<Profile, 'id'>>) => {
    if (!userId) return { error: 'Not authenticated' }
    const { error: err } = await supabase.from('profiles').upsert(
      { id: userId, ...input },
      { onConflict: 'id' }
    )
    if (err) return { error: err.message }
    setProfile((prev) => prev ? { ...prev, ...input } : null)
    return {}
  }, [userId])

  return { profile, loading, update }
}
