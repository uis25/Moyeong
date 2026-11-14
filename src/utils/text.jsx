// 텍스트 렌더링 도우미
import { Fragment } from "react";

/**
 * 이웃한 문자열을 하나로 합쳐서 렌더링합니다.
 * 원본은 HTML 문자열을 이어 붙여 텍스트가 하나의 텍스트 노드였습니다. JSX에서 `글자 {값} 글자`로 쓰면
 * 텍스트 노드가 여러 개로 나뉘어 자간·줄바꿈 위치가 미세하게 달라지므로 이 함수로 합칩니다.
 */
export function mix(...parts) {
  const out = [];
  for (const p of parts.flat(Infinity)) {
    if (p == null || p === false || p === "") continue;
    if (typeof p == "string" || typeof p == "number") { if (typeof out[out.length - 1] == "string") out[out.length - 1] += String(p); else out.push(String(p)) }
    else out.push(p);
  }
  return out.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

/** 검색어 강조 조각 배열 (문자열과 <mark> 요소). 다른 글자와 이어 쓸 때는 mix()로 감쌉니다. */
export function highlightParts(t, QRE) {
  t = String(t ?? ""); if (!QRE) return [t];
  return t.split(QRE).map((s, i) => i % 2 ? <mark className="qh">{s}</mark> : s);
}

/** 검색어 강조 */
export const highlight = (t, QRE) => mix(highlightParts(t, QRE));

/** 자동완성 항목에서 입력한 글자 부분만 굵게 */
export function markInput(t, v) { const k = v.trim(); const i = k ? t.toLowerCase().indexOf(k.toLowerCase()) : -1; return i < 0 ? t : <>{t.slice(0, i)}<mark>{t.slice(i, i + k.length)}</mark>{t.slice(i + k.length)}</> }
