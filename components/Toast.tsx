'use client'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors: Record<string, string> = {
    success: '#4ade80',
    error: '#F97316',
    info: '#3B82F6',
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#111111',
        border: `1px solid ${colors[type]}`,
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 12,
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        zIndex: 9999,
        maxWidth: 320,
        textAlign: 'center',
        boxShadow: `0 0 16px ${colors[type]}40`,
      }}
    >
      {message}
    </div>
  )
}
