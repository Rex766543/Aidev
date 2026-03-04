import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, sections(videos(id))')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const coursesWithCount = (courses || []).map((course) => ({
    ...course,
    videoCount: course.sections.reduce(
      (sum: number, s: { videos: { id: string }[] }) => sum + s.videos.length,
      0
    ),
  }))

  return (
    <div className="relative min-h-screen bg-[#09090b] overflow-x-hidden">

      {/* Background orbs */}
      <div className="orb fixed top-[-200px] right-[-100px] w-[700px] h-[700px] bg-indigo-600/10 pointer-events-none -z-0" style={{ animationDelay: '0s' }} />
      <div className="orb fixed bottom-[-200px] left-[-100px] w-[600px] h-[600px] bg-violet-600/8 pointer-events-none -z-0" style={{ animationDelay: '-5s' }} />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-xl gradient-text">AIDev</span>

          <nav className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/20 transition-all duration-200"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                管理画面
              </Link>
            )}
            {user ? (
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-zinc-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all duration-200"
                >
                  ログアウト
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97]"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6">

        {/* Hero */}
        <section className="pt-20 pb-16 text-center">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              新講座を随時公開中
            </span>
          </div>
          <h1
            className="text-5xl sm:text-6xl font-bold tracking-tight text-white mb-5 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            AI開発を、<br className="sm:hidden" />
            <span className="gradient-text">今日から学ぶ</span>
          </h1>
          <p
            className="text-zinc-400 text-lg max-w-xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.15s' }}
          >
            エンジニア・非エンジニアのための実践的なAI開発講座
          </p>
        </section>

        {/* Course Grid */}
        <section className="pb-20">
          {coursesWithCount.length === 0 ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <p className="text-zinc-500 font-medium mb-1">現在公開中の講座はありません</p>
              <p className="text-zinc-700 text-sm">しばらくお待ちください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {coursesWithCount.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group card-lift bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-indigo-400 ml-1">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-white font-semibold text-base mb-2 line-clamp-2 group-hover:text-indigo-300 transition-colors duration-200">
                      {course.title}
                    </h2>
                    {course.description && (
                      <p className="text-zinc-500 text-sm line-clamp-2 mb-4 leading-relaxed">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-zinc-600 text-xs">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        {course.videoCount} 本の動画
                      </span>
                      <span className="text-indigo-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        詳細を見る →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
