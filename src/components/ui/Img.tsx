import { useState } from 'react'

interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  skeleton?: string
}

export function Img({ className = '', skeleton, ...props }: ImgProps) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  if (errored) return null

  return (
    <div className={`relative overflow-hidden ${className}`} style={loaded ? {} : { background: 'var(--clr-surface)' }}>
      {!loaded && (
        <div className={`absolute inset-0 animate-pulse ${skeleton ?? ''}`} style={{ background: 'var(--clr-primary-dim)' }} />
      )}
      <img
        {...props}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  )
}
