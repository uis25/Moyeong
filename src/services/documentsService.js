// 준비 서류 체크리스트 { "정책id:서류번호": true/false }
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";

/** 서류 체크 상태 전체 */
export async function getDocumentChecks() {
  return readJSON(STORAGE_KEYS.documents, {});
}

/** 서류 하나의 체크 상태 저장 → 바뀐 전체 */
export async function saveDocumentCheck(policyId, index, checked) {
  const next = { ...readJSON(STORAGE_KEYS.documents, {}), [policyId + ":" + index]: checked };
  writeJSON(STORAGE_KEYS.documents, next);
  return next;
}
