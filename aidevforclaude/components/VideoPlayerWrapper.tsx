'use client'

import dynamic from 'next/dynamic'

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false })

export default function VideoPlayerWrapper({
  videoId,
  onComplete,
  alreadyCompleted,
}: {
  videoId: string
  onComplete: () => Promise<void>
  alreadyCompleted: boolean
}) {
  return (
    <VideoPlayer
      videoId={videoId}
      onComplete={onComplete}
      alreadyCompleted={alreadyCompleted}
    />
  )
}
