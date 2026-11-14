// 내 조건 · 필터에 쓰는 고정값

/** 지원 분야 (카테고리 칩) */
export const CATEGORIES = ["농지", "초기자금", "판로", "영농기술", "네트워크(지역사회 관계)", "주거"];

/** 모집 상태 (상태 칩) */
export const STATUSES = ["모집 중", "마감 임박", "접수 예정", "마감", "확인 필요"];

/** 영농 지역 선택지 */
export const REGIONS = ["제주시", "서귀포시"];

/** 영농경력 선택지: value는 EXPERIENCE_RANGES의 인덱스 */
export const EXPERIENCE_LABELS = ["영농 준비 중", "1년 미만", "1~2년", "3~5년", "5년 초과"];

/** 영농경력 선택지별 [최소, 최대] 연수 (자격 판정용) */
export const EXPERIENCE_RANGES = [[0, 0], [0, 1], [1, 2], [3, 5], [5.01, 99]];

/** 농업경영체 등록 선택지 */
export const BUSINESS_OPTIONS = [["1", "등록함"], ["0", "등록 안 함"]];

/** 내 조건 초기값 */
export const EMPTY_CONDITIONS = { age: "", region: "", exp: "", biz: "", cats: [], sts: [] };

/** 정책 목록 한 쪽에 보여 줄 개수 */
export const PAGE_SIZE = 10;
