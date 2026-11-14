// 상태 배지. variant: ok(일치·모집 중) · chk(확인 필요) · no(불일치) · dd(마감 임박·마감) · gr(기타). 스타일: Badge.css
export default function Badge({ variant, children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}

/** 모집 상태 → 배지 색 */
export const statusVariant = st => st == "마감 임박" ? "dd" : st == "모집 중" ? "ok" : "gr";
