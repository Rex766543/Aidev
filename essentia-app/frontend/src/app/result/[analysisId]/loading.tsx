export default function ResultLoading() {
  return (
    <main className="min-h-screen p-6 flex items-center justify-center bg-[#121212]">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#c4b5fd] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#727272] text-sm">解析結果を読み込み中...</p>
      </div>
    </main>
  );
}
