import { StyleResultCard } from "@/components/StyleResultCard";
import { CorrectionPicker } from "@/components/CorrectionPicker";
import { getAnalysis } from "@/lib/api/analyses";
import Link from "next/link";

interface Props {
  params: Promise<{ analysisId: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { analysisId } = await params;

  let analysis;
  try {
    analysis = await getAnalysis(analysisId);
  } catch {
    return (
      <main className="min-h-screen p-6 text-center space-y-4 bg-[#121212]">
        <p className="text-[#f3727f]">解析結果が見つかりません。</p>
        <Link href="/" className="text-[#e6e6fa] hover:underline">
          トップへ戻る
        </Link>
      </main>
    );
  }

  // 録音し直すリンク（同じ track_id で /record へ）
  const reRecordParams = new URLSearchParams({ track_id: analysis.track_id });

  return (
    <main className="min-h-screen p-6 space-y-8 max-w-lg mx-auto bg-[#121212]">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">解析結果</h1>
      </div>

      <StyleResultCard
        top1Style={analysis.top1_style}
        top1Class={analysis.top1_class}
        topStyles={analysis.top_styles}
      />

      <hr className="border-[#282828]" />

      <CorrectionPicker
        analysisId={analysis.id}
        currentStyle={analysis.top1_style}
        topStyles={analysis.top_styles}
      />

      <div className="flex flex-col items-center gap-3 pt-2">
        {/* 録音し直す */}
        <Link
          href={`/record?${reRecordParams.toString()}`}
          className="w-full max-w-xs py-3 bg-[#1f1f1f] text-white rounded-full font-semibold text-center hover:bg-[#272727] active:scale-95 transition-transform shadow-[rgba(0,0,0,0.3)_0px_0px_0px_1px_inset]"
        >
          録音し直す
        </Link>

        <div className="flex gap-6 text-sm">
          <Link href="/" className="text-[#e6e6fa] hover:underline">トップへ戻る</Link>
          <Link href="/history" className="text-[#727272] hover:text-[#b3b3b3] transition-colors">履歴を見る</Link>
        </div>
      </div>
    </main>
  );
}
