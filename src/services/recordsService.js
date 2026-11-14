// 신청 기록 { 정책id: "관심 있음" | "신청 준비 중" | "신청 완료" | "결과 확인" }
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";

/** 신청 기록 전체 */
export async function getRecords() {
  return readJSON(STORAGE_KEYS.records, {});
}

/** 정책의 진행 상태 저장 → 바뀐 전체 */
export async function saveRecord(policyId, status) {
  const next = { ...readJSON(STORAGE_KEYS.records, {}), [policyId]: status };
  writeJSON(STORAGE_KEYS.records, next);
  return next;
}

/** 정책의 기록 삭제 → 바뀐 전체 */
export async function removeRecord(policyId) {
  const next = { ...readJSON(STORAGE_KEYS.records, {}) };
  delete next[policyId];
  writeJSON(STORAGE_KEYS.records, next);
  return next;
}
