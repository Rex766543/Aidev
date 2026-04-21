"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, HistoryItem } from "@/lib/api/history";
import { getAnonId } from "@/lib/anonId";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getAnonId();
    if (!uid) {
      setLoading(false);
      return;
    }
    getHistory(uid)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  function reRecordParams(item: HistoryItem) {
    return new URLSearchParams({
      track_id: item.track.id,
      title: item.track.title,
      artist: item.track.artist,
      ...(item.track.artwork_url ? { artwork: item.track.artwork_url } : {}),
    }).toString();
  }

  return (
    <main className="min-h-screen p-4 space-y-5 max-w-lg mx-auto bg-[#121212]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">解析履歴</h1>
        <Link href="/" className="text-[#e6e6fa] text-sm hover:underline">
          トップへ
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center pt-8">
          <div className="w-6 h-6 border-4 border-[#c4b5fd] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-[#727272] text-sm">履歴がありません。</p>
      )}

      {!loading && items.length > 0 && (
        <ul className="divide-y divide-[#282828]">
          {items.map((item) => (
            <li key={item.analysis_id} className="flex items-center gap-3 py-3">
              {/* サムネイル */}
              <Link href={`/result/${item.analysis_id}`} className="flex-shrink-0">
                {item.track.artwork_url ? (
                  <img
                    src={item.track.artwork_url}
                    alt={item.track.title}
                    className="w-9 h-9 object-cover rounded"
                  />
                ) : (
                  <div className="w-9 h-9 bg-[#282828] rounded" />
                )}
              </Link>

              {/* 曲情報 */}
              <Link href={`/result/${item.analysis_id}`} className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{item.track.title}</p>
                <p className="text-[#727272] text-xs truncate">{item.track.artist}</p>
                <p className="text-[#e6e6fa] text-xs mt-0.5">
                  {item.corrected_style ?? item.top1_style}
                  {item.corrected_style && (
                    <span className="text-[#727272] ml-1">(補正済み)</span>
                  )}
                </p>
              </Link>

              {/* 日付 + 録音し直す */}
              <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                <p className="text-[#4d4d4d] text-xs">
                  {new Date(item.created_at).toLocaleDateString("ja-JP")}
                </p>
                <Link
                  href={`/record?${reRecordParams(item)}`}
                  className="text-xs text-white border border-white/20 rounded-full px-2.5 py-0.5 hover:bg-white/10 active:scale-95 transition-colors whitespace-nowrap"
                >
                  録音し直す
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
