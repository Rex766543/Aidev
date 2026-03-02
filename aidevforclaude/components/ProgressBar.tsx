"use client"

type Props = {
  completed: number
  total: number
  className?: string
}

export default function ProgressBar({ completed, total, className = '' }: Props) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
        <span className="font-medium">
          {percent === 0
            ? 'まだ開始していません'
            : percent === 100
            ? '🎉 完了！'
            : '学習進捗'}
        </span>
        <span className={percent === 100 ? 'text-emerald-400 font-medium' : ''}>
          {completed} / {total} 本
          {percent > 0 && percent < 100 && (
            <span className="text-indigo-400 ml-1">({percent}%)</span>
          )}
          {percent === 100 && ' (100%)'}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
