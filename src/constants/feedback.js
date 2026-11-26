// 의견 남기기에 쓰는 고정값 (DB feedback 테이블의 check 조건과 같아야 함)

/** 만족도 (value는 DB rating 값) */
export const FEEDBACK_RATINGS = [
  { value: 1, emoji: "😞", label: "별로예요" },
  { value: 2, emoji: "😐", label: "보통이에요" },
  { value: 3, emoji: "🙂", label: "좋아요" },
  { value: 4, emoji: "😄", label: "아주 좋아요" },
];

/** 의견 종류 */
export const FEEDBACK_TYPES = ["불편해요", "이런 기능 원해요", "좋았어요"];

/** 의견 내용 최대 글자 수 */
export const FEEDBACK_MAX_LENGTH = 500;
