// 내 조건 (나이·지역·경력·경영체 등록·카테고리·모집 상태)
import { readJSON, writeJSON, STORAGE_KEYS } from "./storage";
import { CATEGORIES, STATUSES, EMPTY_CONDITIONS } from "../constants/conditions";

/** 저장된 내 조건. 예전 형식이나 없어진 카테고리·상태는 정리해서 돌려줌 */
export async function getConditions() {
  const c = readJSON(STORAGE_KEYS.conditions, { ...EMPTY_CONDITIONS });
  if (c.biz == null) c.biz = "";
  c.cats = (c.cats || []).filter(x => CATEGORIES.includes(x));
  c.sts = (c.sts || []).filter(x => STATUSES.includes(x));
  return c;
}

/** 내 조건 저장 → 저장된 값 */
export async function saveConditions(conditions) {
  writeJSON(STORAGE_KEYS.conditions, conditions);
  return conditions;
}
