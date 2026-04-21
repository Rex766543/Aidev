/**
 * 匿名ユーザ UUID の管理。
 * localStorage に永続化し、なければ crypto.randomUUID() で生成する。
 */

const STORAGE_KEY = "essentia_client_uid";

export function getAnonId(): string {
  if (typeof window === "undefined") {
    // SSR 時は空文字（クライアントサイドで取得する）
    return "";
  }
  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
}
