// 정책 목록: 필터 · 정렬 · 쪽 번호
import { evaluate } from "./eligibility";
import { status } from "./policyStatus";
import { queryScore } from "./search";

const RANK = { ok: 0, unknown: 1, no: 2 };
/** 모집 상태 순서 (작을수록 위). 원본은 "마감은 맨 뒤"만 있었고 나머지 상태는 구분하지 않았음 (docs/differences.md) */
const STATUS_ORDER = { "마감 임박": 0, "모집 중": 0, "접수 예정": 1, "확인 필요": 2, "마감": 3 };
const endTime = p => p.applicationEnd ? +new Date(p.applicationEnd) : Infinity;

/**
 * 화면에 보여 줄 정책 목록 [{ p, e(판정), st(상태), qs(검색 점수) }]
 * 마감 정책은 항상 뒤로. sort: fit(나에게 맞는 순) · due(마감 임박순) · new(최신 등록순)
 * - fit: 내 조건 일치도 → 검색 점수(검색어가 있을 때) → 모집 상태 순서 → 일치한 조건 수
 *        (조건·검색어가 없으면 모두 동점이므로 모집 상태 순서대로 나옴)
 * - due · new: 모집 상태 순서 → 마감일 / 등록일
 */
export function buildPolicyList(policies, { profile, conditions, QX, hide, hideEnd, sort }) {
  let L = policies.map(p => ({ p, e: evaluate(p, profile), st: status(p), qs: 0 }))
    .filter(x => (!conditions.cats.length || x.p.category.some(c => conditions.cats.includes(c))) && (!conditions.sts.length || conditions.sts.includes(x.st)) && (x.qs = queryScore(x.p, QX)) > 0);
  if (hide) L = L.filter(x => x.e.overall != "no");
  if (hideEnd) L = L.filter(x => x.st != "마감");
  L.sort((a, b) => {
    const c = (a.st == "마감") - (b.st == "마감"); if (c) return c;
    const s = STATUS_ORDER[a.st] - STATUS_ORDER[b.st];
    if (sort == "due") { if (s) return s; if (a.st == "마감") return endTime(b.p) - endTime(a.p); return endTime(a.p) - endTime(b.p) }
    if (sort == "new") return s || (b.p.reg || "").localeCompare(a.p.reg || "");
    return RANK[a.e.overall] - RANK[b.e.overall] || (QX.length ? b.qs - a.qs : 0) || s || b.e.score - a.e.score
  });
  return L;
}

/** 쪽 번호 목록. 7쪽 이하면 모두, 넘으면 항상 7칸(숫자·… 포함)이 되도록 */
export function pageNumbers(page, total) {
  if (total <= 7) { const n = []; for (let i = 1; i <= total; i++)n.push(i); return n }
  if (page <= 4) return [1, 2, 3, 4, 5, total];
  if (page >= total - 3) return [1, total - 4, total - 3, total - 2, total - 1, total];
  return [1, page - 1, page, page + 1, total];
}
