export default function VideoLoading() {
  return (
    <div className="relative min-h-screen bg-[#09090b] overflow-x-hidden">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 glass border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="shimmer h-4 w-24 rounded" />
          <span className="text-zinc-700">/</span>
          <div className="shimmer h-4 w-48 rounded" />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">

          {/* Main skeleton */}
          <div>
            {/* Player */}
            <div className="shimmer aspect-video rounded-2xl mb-6" />

            {/* Title */}
            <div className="shimmer h-7 w-3/4 rounded mb-3" />
            <div className="shimmer h-4 w-full rounded mb-2 mt-6 pt-4 border-t border-transparent" />
            <div className="shimmer h-4 w-5/6 rounded mb-2" />
            <div className="shimmer h-4 w-2/3 rounded" />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800/60">
              <div className="shimmer h-4 w-32 rounded" />
              <div className="shimmer h-4 w-32 rounded" />
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-zinc-800">
              <div className="shimmer h-3 w-12 rounded mb-2" />
              <div className="shimmer h-4 w-4/5 rounded" />
            </div>
            <div className="px-4 py-3 border-b border-zinc-800/60">
              <div className="shimmer h-2 w-full rounded" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="shimmer w-5 h-5 rounded-full flex-shrink-0" />
                  <div className="shimmer h-3 rounded flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
