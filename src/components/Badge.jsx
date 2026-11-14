// 상태 배지. variant: ok(일치·모집 중) · upcoming(접수 예정: 흐린 초록) · chk(확인 필요) · no(불일치) · dd(마감 임박) · gr(마감·기타). 스타일: Badge.css
export default function Badge({ variant, children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}

/** 모집 상태 → 배지 색 (정책 카드 · 홈 '지금 확인할 정책' 공통) */
export const STATUS_VARIANT = { "모집 중": "ok", "마감 임박": "dd", "접수 예정": "upcoming", "확인 필요": "chk", "마감": "gr" };
