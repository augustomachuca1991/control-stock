export function isOnline(): boolean {
  return navigator.onLine
}

export function listenOnlineStatus(onChange: (online: boolean) => void): () => void {
  const handleOnline = () => onChange(true)
  const handleOffline = () => onChange(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
