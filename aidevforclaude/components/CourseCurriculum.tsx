"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ProgressBar from './ProgressBar'

type Video = {
  id: string
  title: string
  order_index: number
  is_free: boolean
}

type Section = {
  id: string
  title: string
  order_index: number
  videos: Video[]
}

type Props = {
  courseId: string
  sections: Section[]
  firstVideoId: string | null
  userId: string | null
}

export default function CourseCurriculum({ courseId, sections, firstVideoId, userId }: Props) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(!!userId)

  const allVideos = sections.flatMap((s) => s.videos)
  const totalVideos = allVideos.length

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    supabase
      .from('user_progress')
      .select('video_id')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) setCompletedIds(new Set(data.map((p) => p.video_id)))
        setLoading(false)
      })
  }, [userId])

  const completedCount = completedIds.size

  return (
    <>
      {/* 進捗バー（ログイン済みのみ） */}
      {userId && (
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="shimmer h-3 w-16 rounded" />
                <div className="shimmer h-3 w-14 rounded" />
              </div>
              <div className="shimmer h-1.5 rounded-full" />
            </div>
          ) : (
            <ProgressBar completed={completedCount} total={totalVideos} />
          )}
        </div>
      )}

      {/* カリキュラム */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-indigo-500 inline-block" />
          カリキュラム
        </h2>

        {sections.length === 0 ? (
          <p className="text-zinc-600 text-sm py-8 text-center">動画がまだ公開されていません</p>
        ) : (
          <div className="space-y-3 stagger">
            {sections.map((section, sectionIdx) => (
              <div
                key={section.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-colors duration-200"
              >
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/60">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 text-xs font-bold">
                    {sectionIdx + 1}
                  </span>
                  <h3 className="text-white font-medium">{section.title}</h3>
                  <span className="ml-auto text-zinc-600 text-xs">{section.videos.length} 本</span>
                </div>

                {/* Video list */}
                <ul>
                  {section.videos.map((video) => {
                    const isFirst = video.id === firstVideoId
                    const canWatch = !!userId || isFirst
                    const isCompleted = completedIds.has(video.id)

                    return (
                      <li
                        key={video.id}
                        className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800/40 last:border-0 hover:bg-zinc-800/40 transition-colors duration-150 group/item"
                      >
                        {/* 完了チェックマーク */}
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                            isCompleted
                              ? 'bg-emerald-500/15 border-emerald-500/40'
                              : 'bg-zinc-800 border-zinc-700'
                          }`}
                        >
                          {isCompleted && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>

                        {/* Play / Lock icon */}
                        <span className={`flex-shrink-0 ${canWatch ? 'text-indigo-500' : 'text-zinc-700'}`}>
                          {canWatch ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          )}
                        </span>

                        <span
                          className={`text-sm flex-1 ${
                            canWatch
                              ? isCompleted
                                ? 'text-zinc-400'
                                : 'text-zinc-200'
                              : 'text-zinc-500'
                          }`}
                        >
                          {video.title}
                        </span>

                        {isFirst && (
                          <span className="flex-shrink-0 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                            無料
                          </span>
                        )}

                        {canWatch ? (
                          <Link
                            href={`/courses/${courseId}/videos/${video.id}`}
                            className="flex-shrink-0 text-xs text-indigo-400 hover:text-indigo-300 font-medium opacity-0 group-hover/item:opacity-100 transition-all duration-150 hover:underline"
                          >
                            視聴する →
                          </Link>
                        ) : (
                          <Link
                            href={`/login?next=/courses/${courseId}/videos/${video.id}`}
                            className="flex-shrink-0 text-xs text-zinc-600 hover:text-zinc-400 font-medium opacity-0 group-hover/item:opacity-100 transition-all duration-150"
                          >
                            ログイン
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA for guests */}
      {!userId && totalVideos > 1 && (
        <div
          className="mt-8 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <p className="text-white font-medium mb-1">全 {totalVideos} 本の動画を視聴するには</p>
          <p className="text-zinc-500 text-sm mb-4">無料アカウントを作成して、すべての講座にアクセスしましょう</p>
          <Link
            href={`/login?next=/courses/${courseId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97]"
          >
            無料ではじめる →
          </Link>
        </div>
      )}
    </>
  )
}
