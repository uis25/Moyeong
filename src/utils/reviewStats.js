// 후기 통계 · 요약
import { REVIEW_KEYWORDS, POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS } from "../constants/reviews";

/** 통계: 해당 정책 후기만 사용. 비율 = 키워드 선택 인원 / 전체 후기 작성자 */
export function reviewStats(list) {
  const n = list.length, avg = n ? list.reduce((a, r) => a + r.rating, 0) / n : 0, kc = REVIEW_KEYWORDS.map(k => ({ k, c: list.filter(r => r.keywords.includes(k)).length }));
  return { n, avg, kc, top: [...kc].sort((a, b) => b.c - a.c).filter(x => x.c > 0).slice(0, 4) }
}

/** 키워드 빈도 기반 요약 문장 (서버 AI 미연결) */
export function reviewSummary(st) {
  if (st.n < 3) return "요약할 후기가 부족합니다";
  const pc = x => Math.round(x.c / st.n * 100), pick = a => a.map(i => st.kc[i]).sort((x, y) => y.c - x.c)[0], p = pick(POSITIVE_KEYWORDS), q = pick(NEGATIVE_KEYWORDS), o = [];
  if (p.c) o.push(`후기 작성자의 ${pc(p)}%가 '${p.k}'를 선택했습니다.`);
  if (q.c) o.push(`다만 ${pc(q)}%는 '${q.k}'를 선택했습니다.`);
  o.push(`평균 별점은 ${st.avg.toFixed(1)}점입니다.`);
  return o.slice(0, 3).join(" ")
}

/** 별점 문자열 (4 → "★★★★☆") */
export const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

/** 후기 목록 정렬: new(최신순) · hi(별점 높은순) · lo(별점 낮은순) */
export function sortReviews(list, sort) {
  return list.sort((a, b) => sort == "hi" ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt) : sort == "lo" ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt));
}
