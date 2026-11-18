// 화면별 이용 가이드를 닫았는지 (이 기기에만 저장)
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";

/** 닫은 가이드의 화면 키 배열 */
export function loadClosedGuides() {
  const v = readJSON(STORAGE_KEYS.closedGuides, []);
  return Array.isArray(v) ? v : [];
}

/** 닫은 가이드 목록 저장 */
export function saveClosedGuides(list) {
  writeJSON(STORAGE_KEYS.closedGuides, list);
}
