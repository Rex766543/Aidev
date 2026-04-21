import { apiFetch, getApiBase } from "./client";

export interface TrackSearchItem {
  spotify_id: string;
  title: string;
  artist: string;
  album: string | null;
  artwork_url: string | null;
}

export interface TrackResponse {
  id: string;
  spotify_track_id: string;
  title: string;
  artist: string;
  album: string | null;
  artwork_url: string | null;
  created_at: string;
}

export async function searchTracks(
  q: string,
  limit = 10
): Promise<TrackSearchItem[]> {
  const data = await apiFetch<{ items: TrackSearchItem[] }>(
    `/api/tracks/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { signal: AbortSignal.timeout(10000) }
  );
  return data.items;
}

export async function upsertTrack(spotifyId: string): Promise<TrackResponse> {
  return apiFetch<TrackResponse>("/api/tracks", {
    method: "POST",
    body: JSON.stringify({ spotify_id: spotifyId }),
  });
}
