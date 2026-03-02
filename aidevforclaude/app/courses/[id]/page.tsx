import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CourseCurriculum from '@/components/CourseCurriculum'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!course) notFound()

  const { data: sections } = await supabase
    .from('sections')
    .select('id, title, order_index, videos(id, title, order_index, is_free, is_published)')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  type Video = { id: string; title: string; order_index: number; is_free: boolean; is_published: boolean }
  const sortedSections = (sections || []).map((s) => ({
    ...s,
    videos: [...(s.videos as Video[])]
      .filter((v) => v.is_published)
      .sort((a, b) => a.order_index - b.order_index),
  }))

  const allVideos = sortedSections.flatMap((s) => s.videos)
  const firstVideoId = allVideos[0]?.id ?? null
  const totalVideos = allVideos.length

  return (
    <div className="relative min-h-screen bg-[#09090b] overflow-x-hidden">

      {/* Background orb */}
      <div className="orb fixed top-[-150px] right-[-150px] w-[600px] h-[600px] bg-indigo-600/8 pointer-events-none -z-0" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors duration-200 group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-200 group-hover:-translate-x-0.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            講座一覧
          </Link>
          {!user && (
            <Link
              href={`/login?next=/courses/${id}`}
              className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97]"
            >
              ログインして全動画を視聴
            </Link>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">

        {/* Course Info */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">{course.title}</h1>
          {course.description && (
            <p className="text-zinc-400 leading-relaxed text-lg mb-6">{course.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-500">
                <path d="M8 5v14l11-7z"/>
              </svg>
              {totalVideos} 本の動画
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-500">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              {sortedSections.length} セクション
            </span>
          </div>
        </div>

        <CourseCurriculum
          courseId={id}
          sections={sortedSections}
          firstVideoId={firstVideoId}
          userId={user?.id ?? null}
        />
      </main>
    </div>
  )
}
