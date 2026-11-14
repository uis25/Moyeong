// localStorage를 직접 다루는 유일한 파일.
// 나중에 서버(API/DB)로 바꿀 때는 이 파일 대신 각 서비스 파일의 함수 안쪽만 서버 호출로 바꾸면 됩니다.

/** 저장 키 (원본과 같은 키를 그대로 사용) */
export const STORAGE_KEYS = {
  conditions: "bmy",      // 내 조건 {age, region, exp, biz, cats[], sts[]}
  favorites: "bmy_fav",   // 관심 정책 id 배열
  documents: "bmy_docs",  // 서류 체크 {"정책id:서류번호": boolean}
  records: "bmy_rec",     // 신청 기록 {정책id: 진행 상태}
  reviews: "bmy_rv",      // 후기 배열
  userId: "bmy_uid",      // 이 기기의 작성자 id
};

/** JSON 값 읽기 (없거나 읽을 수 없으면 fallback) */
export function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch (e) { return fallback }
}

/** JSON 값 쓰기 (저장할 수 없으면 조용히 무시 — 원본과 같은 동작) */
export function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { }
}
