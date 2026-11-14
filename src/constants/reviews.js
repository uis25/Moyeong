// 선배 후기에 쓰는 고정값

/** 후기 키워드 (최대 3개 선택) */
export const REVIEW_KEYWORDS = ["신청이 쉬워요", "서류가 복잡해요", "설명이 친절해요", "지원이 도움됐어요", "준비 기간이 길어요", "자격 확인이 어려워요"];

/** 요약 문장에 쓰는 긍정·부정 키워드 (REVIEW_KEYWORDS 인덱스) */
export const POSITIVE_KEYWORDS = [0, 2, 3];
export const NEGATIVE_KEYWORDS = [1, 4, 5];

/** 예전 버전에서 저장된 키워드 이름 → 현재 이름 */
export const LEGACY_KEYWORDS = { "신청 쉬움": "신청이 쉬워요", "서류 복잡": "서류가 복잡해요", "설명 친절": "설명이 친절해요", "지원 도움": "지원이 도움됐어요", "준비 기간 김": "준비 기간이 길어요", "자격 확인 어려움": "자격 확인이 어려워요" };

/** 별점 필터 순서 (0 = 전체) */
export const STAR_FILTERS = [0, 5, 4, 3, 2, 1];

/** 후기 정렬 */
export const REVIEW_SORTS = [["new", "최신순"], ["hi", "별점 높은순"], ["lo", "별점 낮은순"]];

/** 한 번에 보여 줄 후기 수 (더 보기 단위) */
export const REVIEWS_PER_PAGE = 5;
