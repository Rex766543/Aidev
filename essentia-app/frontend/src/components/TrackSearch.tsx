"use client";

import { useEffect, useRef, useState } from "react";
import { searchTracks, upsertTrack, TrackSearchItem, TrackResponse } from "@/lib/api/tracks";

interface Props {
  onTrackSelected: (track: TrackResponse) => void;
}

export function TrackSearch({ onTrackSelected }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TrackSearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function onClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);
    setNoResults(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchTracks(value.trim(), 5);
        setSuggestions(items);
        setOpen(items.length > 0);
        setNoResults(items.length === 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  async function handleSelect(item: TrackSearchItem) {
    // ドロップダウンを閉じ、入力欄に曲名を表示
    setOpen(false);
    setSuggestions([]);
    setNoResults(false);
    setQuery(`${item.title}  —  ${item.artist}`);
    setSelecting(true);
    setError(null);
    try {
      const track = await upsertTrack(item.spotify_id);
      onTrackSelected(track);
    } catch {
      setError("曲の登録に失敗しました。もう一度お試しください。");
      setQuery(""); // 入力をリセットして再検索できるように
    } finally {
      setSelecting(false);
    }
  }

  return (
    <div ref={containerRef} className="w-full max-w-xl mx-auto relative">
      {/* 検索入力 */}
      <div className="relative">
        <input
          type="text"
          inputMode="search"
          className="w-full rounded-full px-5 py-3 text-base focus:outline-none pr-10 bg-[#1f1f1f] text-white placeholder-[#727272] shadow-[rgb(124,124,124)_0px_0px_0px_1px_inset] focus:shadow-[#ffffff_0px_0px_0px_1px_inset] disabled:opacity-60 transition-shadow"
          placeholder="曲名・アーティスト名を入力"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          disabled={selecting}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {(loading || selecting) && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <span className="w-4 h-4 border-2 border-[#c4b5fd] border-t-transparent rounded-full animate-spin block" />
          </span>
        )}
      </div>

      {/* 候補ドロップダウン（最大 5 件） */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-[#181818] rounded-xl shadow-[rgba(0,0,0,0.5)_0px_8px_24px] overflow-hidden border border-[#282828]">
          {suggestions.map((item) => (
            <li
              key={item.spotify_id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[#272727] active:bg-[#2a2a2a] border-b border-[#282828] last:border-b-0 transition-colors"
            >
              {item.artwork_url ? (
                <img
                  src={item.artwork_url}
                  alt={item.title}
                  className="w-11 h-11 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 bg-[#282828] rounded flex-shrink-0 flex items-center justify-center text-[#727272] text-xs">
                  ♪
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{item.title}</p>
                <p className="text-[#b3b3b3] text-xs truncate">{item.artist}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 結果なし */}
      {noResults && !loading && query.trim() && (
        <p className="text-[#727272] text-sm mt-2 text-center">
          「{query}」に一致する曲が見つかりませんでした
        </p>
      )}

      {/* エラー */}
      {error && <p className="text-[#f3727f] text-sm mt-2">{error}</p>}
    </div>
  );
}
