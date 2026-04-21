"use client";

import { useEffect, useRef, useState } from "react";
import { correctAnalysis, StyleItem } from "@/lib/api/analyses";
import { getAllStyles, StyleEntry } from "@/lib/api/styles";
import { getAnonId } from "@/lib/anonId";

interface Props {
  analysisId: string;
  currentStyle: string;
  /** AI が返した解析結果（優先候補として表示） */
  topStyles?: StyleItem[];
  onCorrected?: (correctedStyle: string, correctedClass: string) => void;
}

export function CorrectionPicker({ analysisId, currentStyle, topStyles = [], onCorrected }: Props) {
  const [selected, setSelected] = useState<{ style: string; genre: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ジャンルブラウズ用
  const [allStyles, setAllStyles] = useState<StyleEntry[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [genreStyles, setGenreStyles] = useState<StyleEntry[]>([]);
  const [showGenreList, setShowGenreList] = useState(false);

  // フリーワード検索用
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StyleEntry[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ジャンル一覧フェッチ（一度だけ）
  useEffect(() => {
    getAllStyles().then(setAllStyles).catch(() => {});
  }, []);

  // ジャンル選択時にスタイル絞り込み
  useEffect(() => {
    if (!selectedGenre) {
      setGenreStyles([]);
      setShowGenreList(false);
      return;
    }
    setGenreStyles(allStyles.filter((s) => s.genre === selectedGenre));
    setShowGenreList(true);
  }, [selectedGenre, allStyles]);

  // フリーワード検索
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const results = allStyles
      .filter((s) => s.style.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q))
      .slice(0, 10);
    setSearchResults(results);
    setShowSearchResults(true);
  }, [searchQuery, allStyles]);

  // 検索ボックス外クリックで候補を閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const genres = Array.from(new Set(allStyles.map((s) => s.genre))).sort();

  function pickStyle(entry: StyleEntry) {
    setSelected({ style: entry.style, genre: entry.genre });
    // 両方の候補リストを閉じる
    setShowGenreList(false);
    setSelectedGenre("");
    setSearchQuery("");
    setShowSearchResults(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const clientUid = getAnonId();
      await correctAnalysis(analysisId, selected.style, selected.genre, clientUid);
      setSaved(true);
      onCorrected?.(selected.style, selected.genre);
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="text-center space-y-1">
        <p className="text-[#e6e6fa] text-sm font-medium">補正を保存しました</p>
        <p className="text-[#b3b3b3] text-xs">
          {selected?.style}
          {selected?.genre && <span className="ml-1 text-[#727272]">({selected.genre})</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-4">
      <p className="text-sm text-[#b3b3b3] text-center">
        推定結果が違う場合は正しいスタイルを選んでください
        <br />
        <span className="text-xs text-[#727272]">現在の推定: {currentStyle}</span>
      </p>

      {/* AI 推定結果からクイック選択 */}
      {topStyles.length > 0 && (
        <div>
          <p className="text-xs text-[#727272] mb-2">AI の推定結果から選ぶ</p>
          <div className="flex flex-wrap gap-2">
            {topStyles.map((item) => (
              <button
                key={item.rank}
                onClick={() => setSelected({ style: item.style, genre: item.style_class })}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selected?.style === item.style
                    ? "bg-[#e6e6fa] text-black font-medium"
                    : "bg-[#1f1f1f] text-[#b3b3b3] shadow-[rgba(0,0,0,0.3)_0px_0px_0px_1px_inset] hover:text-white"
                }`}
              >
                {item.style}
                <span className="ml-1 text-xs opacity-60">{(item.score * 100).toFixed(0)}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* フリーワード検索 */}
      {allStyles.length > 0 && (
        <div ref={searchRef} className="relative">
          <p className="text-xs text-[#727272] mb-2">スタイル名で検索</p>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
            placeholder="例: Progressive House, Techno..."
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none bg-[#1f1f1f] text-white placeholder-[#4d4d4d] shadow-[rgb(124,124,124)_0px_0px_0px_1px_inset] focus:shadow-[#ffffff_0px_0px_0px_1px_inset]"
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-[#181818] border border-[#282828] rounded-lg divide-y divide-[#282828] shadow-2xl">
              {searchResults.map((entry) => (
                <button
                  key={entry.style}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickStyle(entry)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#272727] transition-colors"
                >
                  <span className="text-white">{entry.style}</span>
                  <span className="text-[#4d4d4d] text-xs ml-2">{entry.genre}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ジャンルから選ぶ */}
      {genres.length > 0 && (
        <div>
          <p className="text-xs text-[#727272] mb-2">ジャンルから絞り込む</p>
          <select
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none bg-[#1f1f1f] text-white shadow-[rgb(124,124,124)_0px_0px_0px_1px_inset] focus:shadow-[#ffffff_0px_0px_0px_1px_inset]"
            value={selectedGenre}
            onChange={(e) => {
              setSelectedGenre(e.target.value);
              setSelected(null);
            }}
          >
            <option value="">ジャンルを選択...</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* 選んだジャンルのスタイル一覧 — 選択後は閉じる */}
          {showGenreList && genreStyles.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto bg-[#181818] border border-[#282828] rounded-lg divide-y divide-[#282828]">
              {genreStyles.map((entry) => (
                <button
                  key={entry.style}
                  onClick={() => pickStyle(entry)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    selected?.style === entry.style
                      ? "bg-[#e6e6fa]/10 text-[#e6e6fa] font-medium"
                      : "hover:bg-[#272727] text-[#b3b3b3]"
                  }`}
                >
                  {entry.style}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 選択中プレビュー */}
      {selected && (
        <div className="bg-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-center shadow-[rgba(0,0,0,0.3)_0px_0px_0px_1px_inset]">
          <span className="font-medium text-[#e6e6fa]">{selected.style}</span>
          {selected.genre && (
            <span className="text-[#727272] ml-1.5">({selected.genre})</span>
          )}
        </div>
      )}

      {error && <p className="text-[#f3727f] text-sm text-center">{error}</p>}

      <button
        className="w-full py-2.5 bg-[#e6e6fa] text-black rounded-full text-sm font-bold disabled:opacity-40 hover:bg-[#d0d0f0] transition-colors"
        onClick={handleSave}
        disabled={saving || !selected}
      >
        {saving ? "保存中..." : "補正を保存"}
      </button>
    </div>
  );
}
