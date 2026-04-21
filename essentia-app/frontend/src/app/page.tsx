"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrackSearch } from "@/components/TrackSearch";
import { TrackResponse } from "@/lib/api/tracks";

export default function HomePage() {
  const router = useRouter();
  const [selectedTrack, setSelectedTrack] = useState<TrackResponse | null>(null);

  function handleTrackSelected(track: TrackResponse) {
    setSelectedTrack(track);
  }

  function handleGoRecord() {
    if (!selectedTrack) return;
    const params = new URLSearchParams({
      track_id: selectedTrack.id,
      title: selectedTrack.title,
      artist: selectedTrack.artist,
      ...(selectedTrack.artwork_url ? { artwork: selectedTrack.artwork_url } : {}),
    });
    router.push(`/record?${params.toString()}`);
  }

  return (
    <main className="min-h-[calc(100dvh-56px)] flex flex-col px-4 pt-8 pb-10 bg-[#121212]">
      {/* タイトル */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">You Music</h1>
        <p className="text-[#b3b3b3] text-sm mt-1">曲を選んで、録音からスタイルを推定</p>
      </div>

      {/* 検索 */}
      <TrackSearch onTrackSelected={handleTrackSelected} />

      {/* 選択済み曲カード + 録音ボタン */}
      {selectedTrack && (
        <div className="mt-6 max-w-xl mx-auto w-full space-y-3">
          {/* 選択済みカード */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1f1f1f] shadow-[rgba(0,0,0,0.5)_0px_0px_0px_1px,rgba(0,0,0,0.3)_0px_8px_8px]">
            {selectedTrack.artwork_url ? (
              <img
                src={selectedTrack.artwork_url}
                alt={selectedTrack.title}
                className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#282828] flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-white">{selectedTrack.title}</p>
              <p className="text-[#b3b3b3] text-xs truncate">{selectedTrack.artist}</p>
            </div>
            <span className="text-[#e6e6fa] text-lg flex-shrink-0">✓</span>
          </div>

          {/* 録音ボタン（大きく・押しやすく） */}
          <button
            className="w-full py-4 bg-[#e6e6fa] text-black rounded-full font-bold text-base hover:bg-[#d0d0f0] active:scale-95 transition-transform shadow-[rgba(0,0,0,0.5)_0px_8px_24px]"
            onClick={handleGoRecord}
          >
            この曲を録音して解析
          </button>
        </div>
      )}

      {/* 履歴リンク */}
      <div className="flex-1 flex items-end justify-center pt-10">
        <a href="/history" className="text-[#727272] text-sm hover:text-[#b3b3b3] transition-colors">
          履歴を見る
        </a>
      </div>
    </main>
  );
}
