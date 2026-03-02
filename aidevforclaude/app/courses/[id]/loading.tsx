export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="glass border-b border-zinc-800/60 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="shimmer h-4 w-16 rounded-full" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12 space-y-4">
          <div className="shimmer h-9 w-3/4 rounded-xl" />
          <div className="shimmer h-4 w-full rounded-lg" />
          <div className="shimmer h-4 w-2/3 rounded-lg" />
          <div className="flex gap-4 pt-1">
            <div className="shimmer h-4 w-24 rounded-full" />
            <div className="shimmer h-4 w-20 rounded-full" />
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/60">
                <div className="shimmer w-6 h-6 rounded-lg" />
                <div className="shimmer h-4 w-1/3 rounded-full" />
              </div>
              <div className="divide-y divide-zinc-800/40">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="shimmer w-5 h-3 rounded" />
                    <div className="shimmer w-3 h-3 rounded" />
                    <div className="shimmer h-3 flex-1 rounded-full" />
                    <div className="shimmer h-3 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
