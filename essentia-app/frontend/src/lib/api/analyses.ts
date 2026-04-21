import { getApiBase } from "./client";
import { apiFetch } from "./client";

export interface StyleItem {
  rank: number;
  style: string;
  style_class: string;
  score: number;
}

export interface AnalysisResponse {
  id: string;
  track_id: string;
  model_name: string;
  model_version: string;
  top1_style: string;
  top1_class: string;
  top_styles: StyleItem[];
  created_at: string;
}

export interface CorrectionResponse {
  id: string;
  analysis_id: string;
  corrected_style: string;
  corrected_class: string;
  created_at: string;
}

export async function createAnalysis(
  audioBlob: Blob,
  trackId: string,
  clientUid: string,
  durationSec?: number
): Promise<AnalysisResponse> {
  const formData = new FormData();
  // recorder.ts が WAV に変換済みなので recording.wav として送信
  const filename = audioBlob.type === "audio/wav" ? "recording.wav" : "recording.webm";
  formData.append("audio", audioBlob, filename);
  formData.append("track_id", trackId);
  formData.append("client_uid", clientUid);
  if (durationSec !== undefined) {
    formData.append("duration_sec", String(durationSec));
  }

  const base = getApiBase();
  const controller = new AbortController();
  // Essentia 推論は最大 2 分かかることがある（初回モデルロード含む）
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${base}/api/analyses`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(detail?.detail ?? `HTTP ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getAnalysis(analysisId: string): Promise<AnalysisResponse> {
  return apiFetch<AnalysisResponse>(`/api/analyses/${analysisId}`, {
    signal: AbortSignal.timeout(10000),
  });
}

export async function correctAnalysis(
  analysisId: string,
  correctedStyle: string,
  correctedClass: string,
  clientUid: string
): Promise<CorrectionResponse> {
  return apiFetch<CorrectionResponse>(
    `/api/analyses/${analysisId}/correction`,
    {
      method: "PUT",
      body: JSON.stringify({
        corrected_style: correctedStyle,
        corrected_class: correctedClass,
        client_uid: clientUid,
      }),
    }
  );
}
