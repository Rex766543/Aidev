"use client";

import { useState } from "react";
import { StyleItem } from "@/lib/api/analyses";

interface Props {
  top1Style: string;
  top1Class: string;
  topStyles: StyleItem[];
}

export function StyleResultCard({ top1Style, top1Class, topStyles }: Props) {
  const [showAll, setShowAll] = useState(false);

  // 上位3件を目立つ表示、残りは「詳細を見る」で展開
  const featured = topStyles.slice(0, 3);
  const rest = topStyles.slice(3);

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      {/* 1位の大きな表示 */}
      <div className="text-center">
        <p className="text-xs text-[#727272] uppercase tracking-widest">{top1Class}</p>
        <h2 className="text-4xl font-bold mt-1 text-white">{top1Style}</h2>
      </div>

      {/* Top 3 */}
      <div className="space-y-3">
        {featured.map((item) => (
          <div key={item.rank} className="flex items-center gap-3">
            <span
              className={`text-xs w-5 text-center font-bold ${
                item.rank === 1 ? "text-yellow-400" : "text-[#727272]"
              }`}
            >
              {item.rank}
            </span>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-white">
                  {item.style}
                  <span className="text-[#727272] text-xs font-normal ml-1.5">
                    {item.style_class}
                  </span>
                </span>
                <span className="text-[#b3b3b3] text-xs">
                  {(item.score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-[#282828] rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    item.rank === 1 ? "bg-[#c4b5fd]" : "bg-[#c4b5fd]/40"
                  }`}
                  style={{ width: `${Math.min(item.score * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 詳細（4位以下）*/}
      {rest.length > 0 && (
        <div>
          <button
            className="text-sm text-[#727272] hover:text-[#b3b3b3] transition-colors w-full text-center"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "閉じる" : `詳細を見る（残り ${rest.length} 件）`}
          </button>

          {showAll && (
            <div className="mt-3 space-y-2">
              {rest.map((item) => (
                <div key={item.rank} className="flex items-center gap-3">
                  <span className="text-xs w-5 text-center text-[#4d4d4d]">{item.rank}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-0.5 text-[#b3b3b3]">
                      <span>
                        {item.style}
                        <span className="text-[#727272] ml-1">{item.style_class}</span>
                      </span>
                      <span>{(item.score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#282828] rounded-full h-1">
                      <div
                        className="bg-[#4d4d4d] h-1 rounded-full"
                        style={{ width: `${Math.min(item.score * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
