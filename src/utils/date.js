// 날짜 관련 순수 함수

/** "YYYY-MM-DD" → 그날 현지 0시 Date. 형식이 틀리거나 없는 날짜(2026-02-30 등)면 null
 *  (new Date("YYYY-MM-DD")는 UTC 0시 = 한국 오전 9시라 TODAY와 비교하면 하루가 어긋남) */
export function parseYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!m) return null;
  const d = new Date(+m[1], m[2] - 1, +m[3]);
  return d.getFullYear() == m[1] && d.getMonth() == m[2] - 1 && d.getDate() == m[3] ? d : null;
}

/** 시연용 기준 날짜: 주소에 ?date=YYYY-MM-DD 가 있고 올바른 날짜면 그 문자열, 아니면 null */
export const DEMO_DATE = (() => {
  try {
    const v = new URLSearchParams(window.location.search).get("date");
    return parseYmd(v) ? v : null;
  } catch (e) { return null }
})();

/** 오늘 0시 (앱을 연 시점 기준, 원본과 같이 한 번만 계산). 시연용 날짜가 있으면 그 날짜 */
export const TODAY = DEMO_DATE ? parseYmd(DEMO_DATE) : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })();

/** 두 자리 숫자 문자열 (3 → "03") */
export const pad2 = n => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" */
export const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
