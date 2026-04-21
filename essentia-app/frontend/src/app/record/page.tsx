"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Recorder } from "@/components/Recorder";
import { createAnalysis } from "@/lib/api/analyses";
import { getAnonId } from "@/lib/anonId";

/** バックエンドの技術的なエラーメッセージをユーザ向けに変換する */
function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("codec") || lower.includes("monoloader") || lower.includes("audioloader")) {
    return "音声形式を認識できませんでした。もう一度録音してください。";
  }
  if (lower.includes("timeout") || lower.includes("abort")) {
    return "解析がタイムアウトしました。もう一度お試しください。";
  }
  if (lower.includes("model") || lower.includes("essentia")) {
    return "解析エンジンの準備ができていません。しばらく待ってから再試行してください。";
  }
  if (lower.includes("track_id")) {
    return "曲の情報が見つかりませんでした。トップページから選び直してください。";
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed")) {
    return "通信エラーが発生しました。接続を確認してください。";
  }
  return "解析に失敗しました。もう一度お試しください。";
}

function RecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackId = searchParams.get("track_id") ?? "";
  const trackTitle = searchParams.get("title") ?? "";
  const trackArtist = searchParams.get("artist") ?? "";
  const artworkUrl = searchParams.get("artwork") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  if (!trackId) {
    return (
      <main className="min-h-[calc(100dvh-56px)] p-6 text-center space-y-4 bg-[#121212]">
        <p className="text-[#f3727f]">曲が選択されていません。</p>
        <button className="text-[#e6e6fa] hover:underline" onClick={() => router.push("/")}>
          トップへ戻る
        </button>
      </main>
    );
  }

  async function handleComplete(blob: Blob, durationSec: number) {
    setAnalyzing(true);
    setError(null);
    try {
      const clientUid = getAnonId();
      const analysis = await createAnalysis(blob, trackId, clientUid, durationSec);
      router.push(`/result/${analysis.id}`);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setError(friendlyError(raw));
      setAnalyzing(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-56px)] flex flex-col bg-[#121212]">
      {/* 選択中の曲（上部に小さく表示） */}
      <div className="px-4 py-3 border-b border-[#282828] bg-[#181818]">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          {artworkUrl ? (
            <img src={artworkUrl} alt={trackTitle} className="w-10 h-10 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded bg-[#282828] flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate text-white">{trackTitle || "録音して解析"}</p>
            {trackArtist && <p className="text-[#b3b3b3] text-xs truncate">{trackArtist}</p>}
          </div>
        </div>
      </div>

      {/* 録音UI：画面中央に配置 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5">
        {error && (
          <div className="w-full max-w-sm bg-[#1f1f1f] border border-[#f3727f]/30 rounded-xl px-4 py-3">
            <p className="text-[#f3727f] text-sm text-center">{error}</p>
          </div>
        )}

        {analyzing ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#c4b5fd] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#b3b3b3]">解析中...</p>
            <p className="text-[#727272] text-xs">初回は少し時間がかかることがあります</p>
          </div>
        ) : (
          <Recorder onComplete={handleComplete} />
        )}
      </div>

      {/* キャンセルボタン（下部） */}
      {!analyzing && (
        <div className="text-center pb-8">
          <button
            className="text-[#727272] text-sm hover:text-[#b3b3b3] transition-colors"
            onClick={() => router.push("/")}
          >
            キャンセル
          </button>
        </div>
      )}
    </main>
  );
}

export default function RecordPage() {
  return (
    <Suspense>
      <RecordContent />
    </Suspense>
  );
}
