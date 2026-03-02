import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, is_published, created_at')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">講座管理</h1>
          <p className="text-zinc-500 text-sm mt-1">{courses?.length ?? 0} 件の講座</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新規講座作成
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <p className="text-zinc-500 font-medium mb-1">講座がまだありません</p>
          <p className="text-zinc-700 text-sm mb-5">最初の講座を作成してみましょう</p>
          <Link
            href="/admin/courses/new"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            + 新規講座作成
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden stagger">
          {courses.map((course, idx) => (
            <div
              key={course.id}
              className={`flex items-center justify-between px-6 py-4 hover:bg-zinc-800/50 transition-colors duration-150 group ${
                idx !== courses.length - 1 ? 'border-b border-zinc-800' : ''
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    course.is_published
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                      : 'text-zinc-500 bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${course.is_published ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                  {course.is_published ? '公開中' : '非公開'}
                </span>
                <span className="text-zinc-200 font-medium truncate">{course.title}</span>
              </div>
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors duration-150 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100"
              >
                編集
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
