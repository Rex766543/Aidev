import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function NewCoursePage() {
  async function createCourse(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || null,
        thumbnail_url: (formData.get('thumbnail_url') as string) || null,
        is_published: formData.get('is_published') === 'true',
      })
      .select('id')
      .single()

    if (!error && data) {
      redirect(`/admin/courses/${data.id}/edit`)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-200 text-sm transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          戻る
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-xl font-bold text-white">新規講座作成</h1>
      </div>

      <form
        action={createCourse}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 space-y-6 animate-fade-in-up"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            タイトル <span className="text-rose-500">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="例：AI開発入門コース"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">説明</label>
          <textarea
            name="description"
            rows={4}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            placeholder="講座の内容を簡潔に説明してください"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">サムネイル URL</label>
          <input
            name="thumbnail_url"
            type="url"
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="https://..."
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              name="is_published"
              value="true"
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-700 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200 peer-focus:ring-2 peer-focus:ring-indigo-500/30" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors duration-150">公開する</span>
        </label>

        <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97]"
          >
            講座を作成する
          </button>
          <Link
            href="/admin"
            className="text-zinc-500 hover:text-zinc-300 text-sm px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all duration-200"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  )
}
