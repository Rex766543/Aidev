import { apiFetch } from "./client";

export interface HistoryItem {
  analysis_id: string;
  track: {
    id: string;          // 内部 UUID（再録音リンク生成に使用）
    spotify_id: string;
    title: string;
    artist: string;
    artwork_url: string | null;
  };
  top1_style: string;
  top1_class: string;
  corrected_style: string | null;
  created_at: string;
}

export async function getHistory(
  clientUid: string,
  limit = 20
): Promise<HistoryItem[]> {
  const data = await apiFetch<{ items: HistoryItem[] }>(
    `/api/my/history?client_uid=${encodeURIComponent(clientUid)}&limit=${limit}`,
    { signal: AbortSignal.timeout(8000) }
  );
  return data.items;
}
