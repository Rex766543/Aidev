import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  updateCourse,
  deleteCourse,
  addSection,
  updateSection,
  deleteSection,
  moveSection,
  addVideo,
  updateVideo,
  deleteVideo,
  moveVideo,
} from './actions'
import { DeleteCourseButton } from '@/app/admin/_components/DeleteCourseButton'

type Video = {
  id: string
  title: string
  youtube_video_id: string
  description: string | null
  is_free: boolean
  is_published: boolean
  order_index: number
}

type Section = {
  id: string
  title: string
  order_index: number
  videos: Video[]
}

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ editSection?: string; editVideo?: string }>
}) {
  const { id } = await params
  const { editSection, editVideo } = await searchParams

  const supabase = await createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) notFound()

  const { data: rawSections } = await supabase
    .from('sections')
    .select('id, title, order_index, videos(id, title, youtube_video_id, description, is_free, is_published, order_index)')
    .eq('course_id', id)
    .order('order_index', { ascending: true })

  const sections: Section[] = (rawSections || []).map((s) => ({
    ...s,
    videos: [...(s.videos as Video[])].sort((a, b) => a.order_index - b.order_index),
  }))

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
          ← 戻る
        </Link>
        <h1 className="text-2xl font-bold text-white">講座編集</h1>
      </div>

      {/* Course Edit Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5">基本情報</h2>
        <form action={updateCourse} className="space-y-5">
          <input type="hidden" name="courseId" value={id} />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              タイトル <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              defaultValue={course.title}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">説明</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={course.description ?? ''}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">サムネイル URL</label>
            <input
              name="thumbnail_url"
              type="url"
              defaultValue={course.thumbnail_url ?? ''}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_published"
              value="true"
              id="course_is_published"
              defaultChecked={course.is_published}
              className="w-4 h-4 rounded border-gray-600 accent-blue-500"
            />
            <label htmlFor="course_is_published" className="text-sm text-gray-300">
              公開する
            </label>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              保存
            </button>
            <DeleteCourseButton courseId={id} action={deleteCourse} />
          </div>
        </form>
      </div>

      {/* Sections */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">セクション・動画</h2>

        {sections.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">セクションがまだありません</p>
        )}

        <div className="space-y-4">
          {sections.map((section, sectionIdx) => (
            <div key={section.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Section Header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
                {editSection === section.id ? (
                  <form action={updateSection} className="flex items-center gap-2 flex-1">
                    <input type="hidden" name="courseId" value={id} />
                    <input type="hidden" name="sectionId" value={section.id} />
                    <input
                      name="title"
                      defaultValue={section.title}
                      autoFocus
                      className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="text-blue-400 hover:text-blue-300 text-sm">保存</button>
                    <Link href={`/admin/courses/${id}/edit`} className="text-gray-500 hover:text-gray-300 text-sm">
                      キャンセル
                    </Link>
                  </form>
                ) : (
                  <>
                    <span className="text-white font-medium flex-1">{section.title}</span>
                    <Link
                      href={`/admin/courses/${id}/edit?editSection=${section.id}`}
                      className="text-gray-400 hover:text-white text-xs transition-colors"
                    >
                      編集
                    </Link>
                  </>
                )}

                {/* Section Order Controls */}
                <form action={moveSection} className="inline">
                  <input type="hidden" name="courseId" value={id} />
                  <input type="hidden" name="sectionId" value={section.id} />
                  <input type="hidden" name="direction" value="up" />
                  <input type="hidden" name="currentIndex" value={section.order_index} />
                  <button
                    type="submit"
                    disabled={sectionIdx === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-1 transition-colors"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveSection} className="inline">
                  <input type="hidden" name="courseId" value={id} />
                  <input type="hidden" name="sectionId" value={section.id} />
                  <input type="hidden" name="direction" value="down" />
                  <input type="hidden" name="currentIndex" value={section.order_index} />
                  <button
                    type="submit"
                    disabled={sectionIdx === sections.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed px-1 transition-colors"
                  >
                    ↓
                  </button>
                </form>
                <form action={deleteSection} className="inline">
                  <input type="hidden" name="courseId" value={id} />
                  <input type="hidden" name="sectionId" value={section.id} />
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300 text-xs transition-colors ml-1"
                  >
                    削除
                  </button>
                </form>
              </div>

              {/* Videos */}
              <div className="px-5 py-3 space-y-2">
                {section.videos.length === 0 && (
                  <p className="text-gray-600 text-xs py-2">動画がまだありません</p>
                )}

                {section.videos.map((video, videoIdx) => (
                  <div key={video.id} className="border border-gray-800 rounded-lg overflow-hidden">
                    {editVideo === video.id ? (
                      // Video Edit Form
                      <form action={updateVideo} className="p-4 space-y-3">
                        <input type="hidden" name="courseId" value={id} />
                        <input type="hidden" name="videoId" value={video.id} />

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">タイトル *</label>
                            <input
                              name="title"
                              required
                              defaultValue={video.title}
                              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">YouTube 動画 ID *</label>
                            <input
                              name="youtube_video_id"
                              required
                              defaultValue={video.youtube_video_id}
                              className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-400 mb-1">説明</label>
                          <textarea
                            name="description"
                            rows={2}
                            defaultValue={video.description ?? ''}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex items-center gap-5">
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input type="checkbox" name="is_free" value="true" defaultChecked={video.is_free} className="accent-blue-500" />
                            無料公開
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input type="checkbox" name="is_published" value="true" defaultChecked={video.is_published} className="accent-blue-500" />
                            公開する
                          </label>
                        </div>

                        <div className="flex gap-2">
                          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors">
                            保存
                          </button>
                          <Link href={`/admin/courses/${id}/edit`} className="text-gray-400 hover:text-white text-xs px-3 py-1.5 rounded transition-colors">
                            キャンセル
                          </Link>
                        </div>
                      </form>
                    ) : (
                      // Video Row
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            video.is_published
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-gray-800 text-gray-500'
                          }`}>
                            {video.is_published ? '公開' : '非公開'}
                          </span>
                          {video.is_free && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400">
                              無料
                            </span>
                          )}
                          <span className="text-sm text-gray-200 truncate">{video.title}</span>
                          <span className="text-xs text-gray-500 shrink-0">{video.youtube_video_id}</span>
                        </div>

                        <Link
                          href={`/admin/courses/${id}/edit?editVideo=${video.id}`}
                          className="text-gray-400 hover:text-white text-xs transition-colors shrink-0"
                        >
                          編集
                        </Link>

                        <form action={moveVideo} className="inline">
                          <input type="hidden" name="courseId" value={id} />
                          <input type="hidden" name="videoId" value={video.id} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <input type="hidden" name="direction" value="up" />
                          <input type="hidden" name="currentIndex" value={video.order_index} />
                          <button
                            type="submit"
                            disabled={videoIdx === 0}
                            className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs px-0.5 transition-colors"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveVideo} className="inline">
                          <input type="hidden" name="courseId" value={id} />
                          <input type="hidden" name="videoId" value={video.id} />
                          <input type="hidden" name="sectionId" value={section.id} />
                          <input type="hidden" name="direction" value="down" />
                          <input type="hidden" name="currentIndex" value={video.order_index} />
                          <button
                            type="submit"
                            disabled={videoIdx === section.videos.length - 1}
                            className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed text-xs px-0.5 transition-colors"
                          >
                            ↓
                          </button>
                        </form>
                        <form action={deleteVideo} className="inline">
                          <input type="hidden" name="courseId" value={id} />
                          <input type="hidden" name="videoId" value={video.id} />
                          <button
                            type="submit"
                            className="text-red-400 hover:text-red-300 text-xs transition-colors ml-1"
                          >
                            削除
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Video Form */}
                <details className="mt-3">
                  <summary className="text-blue-400 hover:text-blue-300 text-xs cursor-pointer select-none py-1">
                    + 動画を追加
                  </summary>
                  <form action={addVideo} className="mt-3 space-y-3 border border-gray-700 rounded-lg p-4">
                    <input type="hidden" name="courseId" value={id} />
                    <input type="hidden" name="sectionId" value={section.id} />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">タイトル *</label>
                        <input
                          name="title"
                          required
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                          placeholder="動画タイトル"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">YouTube 動画 ID *</label>
                        <input
                          name="youtube_video_id"
                          required
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                          placeholder="例：dQw4w9WgXcQ"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">説明</label>
                      <textarea
                        name="description"
                        rows={2}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-5">
                      <label className="flex items-center gap-2 text-xs text-gray-300">
                        <input type="checkbox" name="is_free" value="true" className="accent-blue-500" />
                        無料公開
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-300">
                        <input type="checkbox" name="is_published" value="true" className="accent-blue-500" />
                        公開する
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-1.5 rounded transition-colors"
                    >
                      追加
                    </button>
                  </form>
                </details>
              </div>
            </div>
          ))}
        </div>

        {/* Add Section Form */}
        <form action={addSection} className="mt-4 flex gap-3">
          <input type="hidden" name="courseId" value={id} />
          <input
            name="title"
            required
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="新しいセクション名"
          />
          <button
            type="submit"
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            + セクション追加
          </button>
        </form>
      </div>
    </div>
  )
}
