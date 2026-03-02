import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import VideoPlayerWrapper from '@/components/VideoPlayerWrapper'

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string; videoId: string }>
}) {
  const { id, videoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: video } = await supabase
    .from('videos')
    .select('id, title, description, youtube_video_id, is_free, is_published, section_id, order_index')
    .eq('id', videoId)
    .eq('is_published', true)
    .single()

  if (!video) notFound()

  // 未認証 + 有料動画 → ログインページへ
  if (!video.is_free && !user) {
    redirect(`/login?next=/courses/${id}/videos/${videoId}`)
  }

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!course) notFound()

  // サイドバー用セクション・動画リスト
  const { data: sections } = await supabase
    .from('sections')
    .select('id, title, order_index, videos(id, title, order_index, is_published)')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  type SidebarVideo = { id: string; title: string; order_index: number; is_published: boolean }
  const sortedSections = (sections || []).map((s) => ({
    ...s,
    videos: [...(s.videos as SidebarVideo[])]
      .filter((v) => v.is_published)
      .sort((a, b) => a.order_index - b.order_index),
  }))

  const allVideos = sortedSections.flatMap((s) => s.videos)
  const currentIndex = allVideos.findIndex((v) => v.id === videoId)
  const prevVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null
  const nextVideo = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null

  // ユーザー進捗取得
  let completedVideoIds: Set<string> = new Set()
  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('video_id')
      .eq('user_id', user.id)
    completedVideoIds = new Set((progress || []).map((p) => p.video_id))
  }

  const alreadyCompleted = completedVideoIds.has(videoId)
  const completedCount = completedVideoIds.size
  const totalVideos = allVideos.length

  // 進捗記録 Server Action
  async function recordProgress() {
    'use server'
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return
    await supabase
      .from('user_progress')
      .upsert(
        { user_id: currentUser.id, video_id: videoId, completed_at: new Date().toISOString() },
        { onConflict: 'user_id,video_id' }
      )
    revalidatePath(`/courses/${id}/videos/${videoId}`)
    revalidatePath(`/courses/${id}`)
  }

  return (
    <div className="relative min-h-screen bg-[#09090b] overflow-x-hidden">
      {/* Background orb */}
      <div className="orb fixed top-[-150px] right-[-150px] w-[600px] h-[600px] bg-indigo-600/8 pointer-events-none -z-0" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${id}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors duration-200 group flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-200 group-hover:-translate-x-0.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            カリキュラム
          </Link>
          <span className="text-zinc-700 flex-shrink-0">/</span>
          <span className="text-zinc-300 text-sm font-medium truncate">{video.title}</span>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

          {/* メインコンテンツ */}
          <div className="min-w-0">
            {/* Video Player */}
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
              <VideoPlayerWrapper
                videoId={video.youtube_video_id}
                onComplete={recordProgress}
                alreadyCompleted={alreadyCompleted}
              />
            </div>

            {/* 動画情報 */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{video.title}</h1>
                {alreadyCompleted && (
                  <span className="flex-shrink-0 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    完了済み
                  </span>
                )}
              </div>
              {video.description && (
                <p className="text-zinc-400 leading-relaxed text-sm border-t border-zinc-800/60 pt-4 mt-4">
                  {video.description}
                </p>
              )}
            </div>

            {/* 前後ナビゲーション */}
            <div
              className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-zinc-800/60 animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}
            >
              {prevVideo ? (
                <Link
                  href={`/courses/${id}/videos/${prevVideo.id}`}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200 group max-w-[45%]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  <span className="truncate">{prevVideo.title}</span>
                </Link>
              ) : <div />}

              {nextVideo ? (
                <Link
                  href={`/courses/${id}/videos/${nextVideo.id}`}
                  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200 group max-w-[45%] ml-auto"
                >
                  <span className="truncate">{nextVideo.title}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              ) : <div />}
            </div>
          </div>

          {/* サイドバー */}
          <aside
            className="lg:max-h-[calc(100vh-73px)] lg:sticky lg:top-[73px] overflow-y-auto animate-fade-in-up"
            style={{ animationDelay: '0.08s' }}
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* コースタイトル */}
              <div className="px-4 py-3.5 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">コース</p>
                <h2 className="text-sm font-semibold text-white leading-snug line-clamp-2">{course.title}</h2>
              </div>

              {/* 進捗バー（ログイン済みのみ） */}
              {user && (
                <div className="px-4 py-3 border-b border-zinc-800/60">
                  <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                    <span>進捗</span>
                    <span>{completedCount} / {totalVideos} 本</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: totalVideos > 0 ? `${Math.round((completedCount / totalVideos) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              )}

              {/* 動画リスト */}
              <div>
                {sortedSections.map((section) => (
                  <div key={section.id}>
                    <div className="px-4 py-2 bg-zinc-950/50">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">
                        {section.title}
                      </p>
                    </div>
                    {section.videos.map((v) => {
                      const isCurrent = v.id === videoId
                      const isCompleted = completedVideoIds.has(v.id)
                      return (
                        <Link
                          key={v.id}
                          href={`/courses/${id}/videos/${v.id}`}
                          className={`flex items-center gap-3 px-4 py-2.5 border-l-2 transition-colors duration-150 ${
                            isCurrent
                              ? 'bg-indigo-500/10 border-indigo-500'
                              : 'hover:bg-zinc-800/50 border-transparent'
                          }`}
                        >
                          {/* 完了・現在・未再生 インジケーター */}
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${
                            isCompleted
                              ? 'bg-emerald-500/15 border-emerald-500/40'
                              : isCurrent
                              ? 'bg-indigo-500/20 border-indigo-500/50'
                              : 'bg-zinc-800 border-zinc-700'
                          }`}>
                            {isCompleted ? (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : isCurrent ? (
                              <svg width="6" height="6" viewBox="0 0 24 24" fill="#818cf8">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            ) : null}
                          </span>
                          <span className={`text-xs leading-snug ${
                            isCurrent
                              ? 'text-indigo-300 font-medium'
                              : isCompleted
                              ? 'text-zinc-400'
                              : 'text-zinc-500'
                          }`}>
                            {v.title}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
