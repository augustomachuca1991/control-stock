import { useState, useEffect } from 'react'
import { isOnline, listenOnlineStatus } from '../lib/offline'

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline())
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const cleanup = listenOnlineStatus((status) => {
      setOnline(status)
      if (!status) setWasOffline(true)
    })
    return cleanup
  }, [])

  return { isOnline: online, wasOffline }
}
