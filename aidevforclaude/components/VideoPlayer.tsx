'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: object) => { destroy: () => void }
      PlayerState: { ENDED: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export default function VideoPlayer({
  videoId,
  onComplete,
  alreadyCompleted,
}: {
  videoId: string
  onComplete: () => Promise<void>
  alreadyCompleted: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [completed, setCompleted] = useState(alreadyCompleted)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let player: { destroy?: () => void } | null = null

    const initPlayer = () => {
      if (!containerRef.current) return

      // div を作り直してプレイヤーをマウント
      const el = document.createElement('div')
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(el)

      player = new window.YT.Player(el, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT.PlayerState.ENDED && !completed) {
              setCompleted(true)
              startTransition(async () => {
                await onComplete()
              })
            }
          },
        },
      })
    }

    if (typeof window !== 'undefined') {
      if (window.YT?.Player) {
        initPlayer()
      } else {
        window.onYouTubeIframeAPIReady = initPlayer
        if (!document.getElementById('yt-iframe-api')) {
          const s = document.createElement('script')
          s.id = 'yt-iframe-api'
          s.src = 'https://www.youtube.com/iframe_api'
          document.head.appendChild(s)
        }
      }
    }

    return () => {
      if (player && typeof (player as { destroy?: () => void }).destroy === 'function') {
        ;(player as { destroy: () => void }).destroy()
      }
    }
  }, [videoId])

  return (
    <div className="relative aspect-video bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
      <div ref={containerRef} className="absolute inset-0" />

      {/* 完了バッジ */}
      {(completed || alreadyCompleted) && !isPending && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          完了済み
        </div>
      )}

      {/* 記録中オーバーレイ */}
      {isPending && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm text-zinc-300 text-xs px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          進捗を記録中…
        </div>
      )}
    </div>
  )
}
