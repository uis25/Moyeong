// 내 조건과 정책 자격을 비교하는 판정 함수. 결과: "ok"(일치) · "no"(불일치) · "unknown"(확인 필요)
import { EXPERIENCE_RANGES } from "../constants/conditions";

export function checkAge(p, age) { if (age == null) return "unknown"; if (p.minAge == null && p.maxAge == null) return "unknown"; return (p.minAge != null && age < p.minAge) || (p.maxAge != null && age > p.maxAge) ? "no" : "ok" }
export function checkRegion(p, r) { if (!r) return "unknown"; if (!p.eligibleRegions.length) return "unknown"; return p.eligibleRegions.includes(r) || p.eligibleRegions.includes("제주특별자치도 전체") ? "ok" : "no" }
export function checkExp(p, b) { if (b == null) return "unknown"; if (p.minFarmingYears == null && p.maxFarmingYears == null) return "unknown"; const [lo, hi] = EXPERIENCE_RANGES[b]; const a = p.minFarmingYears ?? 0, z = p.maxFarmingYears ?? 99; if (hi < a || lo > z) return "no"; return lo >= a && hi <= z ? "ok" : "unknown" }
export function checkBiz(p, b) { const r = p.requiresBusinessRegistration; if (r == null) return "unknown"; if (r === false) return "ok"; if (b == null) return "unknown"; return b ? "ok" : "no" }

/** 네 가지 조건 판정 + 종합 결과(overall) + 일치 개수(score) */
export function evaluate(p, u) {
  const c = [["연령", checkAge(p, u.age)], ["지역", checkRegion(p, u.region)], ["영농경력", checkExp(p, u.exp)], ["농업경영체 등록", checkBiz(p, u.biz)]];
  const s = c.map(x => x[1]); const overall = s.includes("no") ? "no" : s.includes("unknown") ? "unknown" : "ok";
  return { checks: c, overall, score: s.filter(x => x == "ok").length }
}

/** 저장된 내 조건(문자열) → 판정에 쓰는 값(숫자·null) */
export function toProfile(S) { return { age: S.age === "" ? null : +S.age, region: S.region, exp: S.exp === "" ? null : +S.exp, biz: S.biz === "" ? null : S.biz === "1" } }

/** 내 조건 중 하나라도 입력됐는지 ("조건 불일치 숨기기" 자동 켜기 기준) */
export function hasProfile(S) { return S.age !== "" || !!S.region || S.exp !== "" || S.biz !== "" }

/** 원본에 있던 간단 자체 테스트 (콘솔에 결과 출력) */
export function runEligibilitySelfTest() {
  const t = []; const eq = (n, a, b) => t.push([n, a === b]);
  eq("연령 범위 밖", checkAge({ minAge: 18, maxAge: 39 }, 45), "no"); eq("연령 범위 안", checkAge({ minAge: 18, maxAge: 39 }, 30), "ok");
  eq("연령 조건 누락→확인 필요", checkAge({ minAge: null, maxAge: null }, 30), "unknown"); eq("지역 불일치", checkRegion({ eligibleRegions: ["제주시"] }, "서귀포시"), "no");
  eq("지역 누락→확인 필요", checkRegion({ eligibleRegions: [] }, "제주시"), "unknown"); eq("경력 준비중 vs 3년 이상", checkExp({ minFarmingYears: 3, maxFarmingYears: null }, 0), "no");
  eq("경력 3~5년 vs 0~3년(일부 겹침)→확인 필요", checkExp({ minFarmingYears: 0, maxFarmingYears: 3 }, 3), "unknown"); eq("경력 1~2년 vs 0~3년", checkExp({ minFarmingYears: 0, maxFarmingYears: 3 }, 2), "ok");
  eq("경영체 필요 vs 미등록", checkBiz({ requiresBusinessRegistration: true }, false), "no"); eq("경영체 명시 없음→확인 필요", checkBiz({ requiresBusinessRegistration: null }, true), "unknown"); eq("전체 불일치 우선", evaluate({ minAge: 50, maxAge: 60, eligibleRegions: [], minFarmingYears: null, maxFarmingYears: null }, { age: 30, region: "", exp: null }).overall, "no");
  const bad = t.filter(x => !x[1]); if (bad.length) console.warn("자체 테스트 실패:", bad.map(x => x[0])); else console.info("자체 테스트 " + t.length + "/" + t.length + " 통과")
}
