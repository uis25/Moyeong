// 정책의 모집 상태 · 마감일 계산
import { TODAY } from "./date";

/** 마감까지 남은 일수 (오늘 마감이면 0) */
export function dday(p) { return Math.round((new Date(p.applicationEnd) - TODAY) / 864e5) }

/** 모집 상태: 확인 필요 · 접수 예정 · 마감 · 마감 임박(7일 이내) · 모집 중 */
export function status(p) {
  const s = p.applicationStart && new Date(p.applicationStart), e = p.applicationEnd && new Date(p.applicationEnd);
  if (!e) return "확인 필요"; if (s && TODAY < s) return "접수 예정"; if (TODAY > e) return "마감"; return dday(p) <= 7 ? "마감 임박" : "모집 중"
}

/** "기관 · 마감 YYYY-MM-DD (D-n)" 한 줄 설명 (관심 정책·신청 기록 목록) */
export function deadlineMeta(p) { return p.organization + " · 마감 " + (p.applicationEnd || "확인 필요") + (p.applicationEnd && status(p) != "마감" ? " (D-" + dday(p) + ")" : "") }

/** 달력에 표시할 짧은 분야 이름 */
export const shortCategory = p => ((p.category || [])[0] || "기타").replace("네트워크(지역사회 관계)", "네트워크");
