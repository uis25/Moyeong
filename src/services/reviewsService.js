// 선배 후기
// 후기 형태: { id, policyId, authorId, rating(1~5), keywords[], content, createdAt("YYYY-MM-DD"), updatedAt }
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";
import { LEGACY_KEYWORDS } from "../constants/reviews";

// 예전 버전 키워드 이름을 현재 이름으로 바꿈
const fixKeywords = a => Array.isArray(a) ? a.map(k => LEGACY_KEYWORDS[k] || k) : a;
const load = () => readJSON(STORAGE_KEYS.reviews, []).map(r => r && typeof r == "object" ? { ...r, keywords: fixKeywords(r.keywords) } : r);

/** 전체 후기 */
export async function getReviews() {
  return load();
}

/** 후기 저장. 같은 작성자가 같은 정책에 쓴 후기가 있으면 수정(id 유지), 없으면 추가 → 바뀐 전체 */
export async function saveReview(review) {
  const list = load();
  const i = list.findIndex(r => r.policyId == review.policyId && r.authorId == review.authorId);
  const { id, policyId, authorId, ...fields } = review;
  const next = i >= 0 ? list.map((r, j) => j == i ? { ...r, ...fields } : r) : [...list, { id, policyId, authorId, ...fields }];
  writeJSON(STORAGE_KEYS.reviews, next);
  return next;
}

/** 작성자의 해당 정책 후기 삭제 → 바뀐 전체 */
export async function removeReview(policyId, authorId) {
  const next = load().filter(r => !(r.policyId == policyId && r.authorId == authorId));
  writeJSON(STORAGE_KEYS.reviews, next);
  return next;
}
