// 관심 정책 (정책 id 배열)
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";

/** 관심 정책 id 목록 */
export async function getFavorites() {
  return readJSON(STORAGE_KEYS.favorites, []);
}

/** 관심 정책 추가 → 바뀐 전체 목록 */
export async function saveFavorite(policyId) {
  const list = readJSON(STORAGE_KEYS.favorites, []);
  const next = list.includes(policyId) ? list : [...list, policyId];
  writeJSON(STORAGE_KEYS.favorites, next);
  return next;
}

/** 관심 정책 해제 → 바뀐 전체 목록 */
export async function removeFavorite(policyId) {
  const next = readJSON(STORAGE_KEYS.favorites, []).filter(x => x != policyId);
  writeJSON(STORAGE_KEYS.favorites, next);
  return next;
}
