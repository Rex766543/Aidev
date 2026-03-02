'use client'

import { useTransition } from 'react'

export function DeleteCourseButton({
  courseId,
  action,
}: {
  courseId: string
  action: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm('この講座を削除しますか？セクション・動画もすべて削除されます。')) return
        startTransition(async () => {
          const fd = new FormData()
          fd.append('courseId', courseId)
          await action(fd)
        })
      }}
      className="text-red-400 hover:text-red-300 text-sm transition-colors disabled:opacity-50"
    >
      {isPending ? '削除中...' : '講座を削除'}
    </button>
  )
}
