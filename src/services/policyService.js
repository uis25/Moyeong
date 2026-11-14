// 정책 데이터. 지금은 앱에 포함된 JSON, 나중에 서버 API로 교체
import POLICIES from "../constants/policies.json";

/** 전체 정책 목록 */
export async function getPolicies() {
  return POLICIES;
}
