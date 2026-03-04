'use client'

import { useState } from 'react'
import Image from 'next/image'

function extractYouTubeId(input: string): string | null {
  // youtube.com/watch?v=ID
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  // youtu.be/ID
  const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  // youtube.com/embed/ID
  const embedMatch = input.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]
  // 11文字のIDのみ
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim()
  return null
}

export default function ThumbnailInput({ defaultValue }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [preview, setPreview] = useState(defaultValue ?? '')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const ytId = extractYouTubeId(raw)
    if (ytId) {
      const thumbUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
      setValue(thumbUrl)
      setPreview(thumbUrl)
    } else {
      setValue(raw)
      setPreview(raw)
    }
  }

  return (
    <div className="space-y-2">
      <input
        name="thumbnail_url"
        type="text"
        value={value}
        onChange={handleChange}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        placeholder="YouTube URL / 動画ID / 画像URL（任意）"
      />
      {preview && (
        <div className="relative aspect-video w-48 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
          <Image
            src={preview}
            alt="サムネイルプレビュー"
            fill
            className="object-cover"
            onError={() => setPreview('')}
            unoptimized
          />
        </div>
      )}
    </div>
  )
}
