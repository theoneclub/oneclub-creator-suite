'use client'
import { useEffect, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function MatrixRain({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let paused = false

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const cols = Math.floor(canvas.width / 16)
    const drops = Array(cols).fill(1)

    const draw = () => {
      if (paused) { animId = requestAnimationFrame(draw); return }
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const highlight = Math.random() < 0.05
        ctx.fillStyle = highlight ? '#4ade80' : '#003300'
        ctx.font = '14px monospace'
        ctx.fillText(char, i * 16, drops[i] * 16)
        if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    const onBlur = () => { paused = true }
    const onFocus = () => { paused = false }
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18, pointerEvents: 'none' }}
    />
  )
}
