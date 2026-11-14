// 검색: 유사어 확장 · 관련도 점수 · 자동완성 추천
import { SYNONYM_GROUPS } from "../constants/synonyms";
import { CATEGORIES } from "../constants/conditions";

/** 비교용 정규화: 소문자 + 공백 제거 */
export const nz = t => String(t || "").toLowerCase().replace(/\s+/g, "");

/** 정규화된 유사어 → 원래 표기 */
export const SYNONYM_RAW = {}; SYNONYM_GROUPS.flat().forEach(w => SYNONYM_RAW[nz(w)] = w);

/* 한 글자 말(땅·돈·집)은 "모집"처럼 다른 낱말 속에 섞여 잘못 걸리므로, 유사어가 있으면 유사어로만 찾습니다. */
export function expandToken(t) { const k = nz(t); const set = new Set([k]); SYNONYM_GROUPS.forEach(g => { if (g.some(w => nz(w) == k)) g.forEach(w => set.add(nz(w))) }); if (k.length == 1 && set.size > 1) set.delete(k); return [...set] }

/** 확정된 검색어 → 토큰별 확장어(QX) + 강조용 정규식(QRE) */
export function buildQuery(Q) {
  const QX = Q ? Q.split(/\s+/).filter(Boolean).map(t => ({ t: nz(t), words: expandToken(t) })) : [];
  /* 검색어·유사어 강조: 띄어쓰기가 달라도 맞도록 글자 사이에 공백을 허용한 정규식 */
  const ws = [...new Set(QX.flatMap(x => x.words))].filter(Boolean).sort((a, b) => b.length - a.length);
  const QRE = ws.length ? new RegExp("(" + ws.map(w => [...w].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*")).join("|") + ")", "gi") : null;
  return { QX, QRE };
}

/** 검색어와 함께 찾은 유사어 (원래 표기) */
export function relatedWords(QX) { return [...new Set(QX.flatMap(x => x.words.filter(w => w != x.t).map(w => SYNONYM_RAW[w] || w)))] }

function searchFields(p) { return p._sf || (p._sf = { ti: nz(p.title), ca: nz(p.category.join(" ") + " " + p.supportType.join(" ")), or: nz(p.organization + " " + (p.sourceName || "")), de: nz(p.description + " " + p.eligibilityDetails.join(" ") + " " + p.eligibleFarmerTypes.join(" ")) }) }

/** 관련도 점수 (0이면 결과에서 제외). 모든 토큰이 (원래 말 또는 유사어로) 어딘가에 있어야 함.
 *  점수: 정책명 > 분야·지원 유형 > 기관 > 설명. 원래 말은 유사어보다 높게. */
export function queryScore(p, QX) {
  if (!QX.length) return 1; const f = searchFields(p); let tot = 0;
  for (const x of QX) { let best = 0; for (const w of x.words) { const m = w == x.t ? 1 : .6; const s = (f.ti.includes(w) ? 10 : 0) || (f.ca.includes(w) ? 6 : 0) || (f.or.includes(w) ? 4 : 0) || (f.de.includes(w) ? 2 : 0); if (s * m > best) best = s * m } if (!best) return 0; tot += best } return tot
}

/** 검색어 일치 부분이 있는 문장과 위치 (정책명에 이미 있으면 null) */
export function findSnippet(p, QRE) {
  if (!QRE) return null; if (new RegExp(QRE.source, "i").test(p.title)) return null;
  const src = [p.description, ...p.eligibilityDetails, p.organization, p.category.join(" · "), p.supportType.join(" · ")];
  for (const t of src) { const m = new RegExp(QRE.source, "i").exec(t || ""); if (m) { const a = Math.max(0, m.index - 28), b = Math.min(t.length, m.index + m[0].length + 40); return { text: t.slice(a, b), before: a > 0, after: b < t.length } } }
  return null
}

/* 자동완성: 실제 정책명 + 동의어 사전 + 지원 분야에서만 추천 */
const SUGGEST_WORDS = [...new Set([...SYNONYM_GROUPS.flat(), ...CATEGORIES])];
export function buildSuggestions(v, policies) {
  const k = nz(v); if (!k) return []; const hit = (s) => nz(s).indexOf(k);
  const kw = SUGGEST_WORDS.map(w => ({ v: w, kind: "검색어", i: hit(w) })).filter(o => o.i >= 0);
  const syn = SYNONYM_GROUPS.filter(g => g.some(w => nz(w) == k)).flat().filter(w => nz(w) != k).map(w => ({ v: w, kind: "유사어", i: 99 }));
  const pol = policies.map(p => ({ v: p.title, kind: "정책", i: hit(p.title) })).filter(o => o.i >= 0);
  const seen = new Set(), out = []; for (const o of [...kw.sort((a, b) => a.i - b.i || a.v.length - b.v.length), ...pol.sort((a, b) => a.i - b.i), ...syn]) { if (seen.has(o.v)) continue; seen.add(o.v); out.push(o); if (out.length == 5) break } return out
}
