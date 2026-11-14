// 이 기기의 작성자 id (후기 작성자 구분용). 나중에 로그인 사용자 id로 교체
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";

/** 작성자 id. 없으면 새로 만들어 저장 */
export async function getUserId() {
  let id = readJSON(STORAGE_KEYS.userId, null);
  if (!id) { id = "u" + Math.random().toString(36).slice(2, 9); writeJSON(STORAGE_KEYS.userId, id) }
  return id;
}
