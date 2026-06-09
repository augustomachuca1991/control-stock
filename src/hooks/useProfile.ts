import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types'

const AVATAR_BUCKET = 'avatars'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

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

  const uploadAvatar = useCallback(async (file: File): Promise<{ url?: string; error?: string }> => {
    if (!userId) return { error: 'Not authenticated' }
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true })

    if (uploadErr) {
      setUploading(false)
      return { error: uploadErr.message }
    }

    const { data: publicUrl } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(path)

    const url = publicUrl.publicUrl

    await supabase.from('profiles').upsert(
      { id: userId, avatar_url: url },
      { onConflict: 'id' }
    )

    setProfile((prev) => prev ? { ...prev, avatar_url: url } : null)
    setUploading(false)
    return { url }
  }, [userId])

  return { profile, loading, uploading, update, uploadAvatar }
}
