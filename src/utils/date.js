// 날짜 관련 순수 함수

/** 오늘 0시 (앱을 연 시점 기준, 원본과 같이 한 번만 계산) */
export const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })();

/** 두 자리 숫자 문자열 (3 → "03") */
export const pad2 = n => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" */
export const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
