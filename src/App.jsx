/*
 * 1단계: 원본 index.html을 React 단일 파일로 옮긴 비교 기준 버전.
 * - 원본의 전역 변수 + render()/innerHTML 방식을 React state + JSX로 바꿨습니다.
 * - 원본의 document 클릭 리스너들이 실행되던 순서, innerHTML 재생성으로 생기던 효과
 *   (열린 카드 상세 영역의 페이드 애니메이션 재생 등)는 동작이 같도록 그대로 재현했습니다.
 * - 아티팩트 전용 공유 저장소(window.claude.use("db"))는 제거하고 localStorage 모드만 남겼습니다.
 *   (원본도 아티팩트 밖에서 열면 localStorage 모드로 동작합니다.)
 */
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import P from "./data/policies.json";
import brandLogo from "./assets/brand-logo.png";
import heroCharacter from "./assets/hero-character.png";
import footerLogo from "./assets/footer-logo.png";
import CHG from "./assets/character-greeting.png";
import CHP from "./assets/character-pointing.png";

const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d })();
const FY = [[0, 0], [0, 1], [1, 2], [3, 5], [5.01, 99]];

/* ---- 독립 판정 함수 ---- */
function checkAge(p, age) { if (age == null) return "unknown"; if (p.minAge == null && p.maxAge == null) return "unknown"; return (p.minAge != null && age < p.minAge) || (p.maxAge != null && age > p.maxAge) ? "no" : "ok" }
function checkRegion(p, r) { if (!r) return "unknown"; if (!p.eligibleRegions.length) return "unknown"; return p.eligibleRegions.includes(r) || p.eligibleRegions.includes("제주특별자치도 전체") ? "ok" : "no" }
function checkExp(p, b) { if (b == null) return "unknown"; if (p.minFarmingYears == null && p.maxFarmingYears == null) return "unknown"; const [lo, hi] = FY[b]; const a = p.minFarmingYears ?? 0, z = p.maxFarmingYears ?? 99; if (hi < a || lo > z) return "no"; return lo >= a && hi <= z ? "ok" : "unknown" }
function checkBiz(p, b) { const r = p.requiresBusinessRegistration; if (r == null) return "unknown"; if (r === false) return "ok"; if (b == null) return "unknown"; return b ? "ok" : "no" }
function evaluate(p, u) {
  const c = [["연령", checkAge(p, u.age)], ["지역", checkRegion(p, u.region)], ["영농경력", checkExp(p, u.exp)], ["농업경영체 등록", checkBiz(p, u.biz)]];
  const s = c.map(x => x[1]); const overall = s.includes("no") ? "no" : s.includes("unknown") ? "unknown" : "ok";
  return { checks: c, overall, score: s.filter(x => x == "ok").length }
}
function status(p) { const s = p.applicationStart && new Date(p.applicationStart), e = p.applicationEnd && new Date(p.applicationEnd); if (!e) return "확인 필요"; if (s && TODAY < s) return "접수 예정"; if (TODAY > e) return "마감"; return dday(p) <= 7 ? "마감 임박" : "모집 중" }
function dday(p) { return Math.round((new Date(p.applicationEnd) - TODAY) / 864e5) }

/* ---- 간단 테스트 ---- */
(function () {
  const t = []; const eq = (n, a, b) => t.push([n, a === b]);
  eq("연령 범위 밖", checkAge({ minAge: 18, maxAge: 39 }, 45), "no"); eq("연령 범위 안", checkAge({ minAge: 18, maxAge: 39 }, 30), "ok");
  eq("연령 조건 누락→확인 필요", checkAge({ minAge: null, maxAge: null }, 30), "unknown"); eq("지역 불일치", checkRegion({ eligibleRegions: ["제주시"] }, "서귀포시"), "no");
  eq("지역 누락→확인 필요", checkRegion({ eligibleRegions: [] }, "제주시"), "unknown"); eq("경력 준비중 vs 3년 이상", checkExp({ minFarmingYears: 3, maxFarmingYears: null }, 0), "no");
  eq("경력 3~5년 vs 0~3년(일부 겹침)→확인 필요", checkExp({ minFarmingYears: 0, maxFarmingYears: 3 }, 3), "unknown"); eq("경력 1~2년 vs 0~3년", checkExp({ minFarmingYears: 0, maxFarmingYears: 3 }, 2), "ok");
  eq("경영체 필요 vs 미등록", checkBiz({ requiresBusinessRegistration: true }, false), "no"); eq("경영체 명시 없음→확인 필요", checkBiz({ requiresBusinessRegistration: null }, true), "unknown"); eq("전체 불일치 우선", evaluate({ minAge: 50, maxAge: 60, eligibleRegions: [], minFarmingYears: null, maxFarmingYears: null }, { age: 30, region: "", exp: null }).overall, "no");
  const bad = t.filter(x => !x[1]); if (bad.length) console.warn("자체 테스트 실패:", bad.map(x => x[0])); else console.info("자체 테스트 " + t.length + "/" + t.length + " 통과")
})();

/* ---- 저장 ---- */
const ls = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
const PER = 10;
const CATS = ["농지", "초기자금", "판로", "영농기술", "네트워크(지역사회 관계)", "주거"], STS = ["모집 중", "마감 임박", "접수 예정", "마감", "확인 필요"], EXPL = ["영농 준비 중", "1년 미만", "1~2년", "3~5년", "5년 초과"];
const ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const EMPTY_S = { age: "", region: "", exp: "", biz: "", cats: [], sts: [] };

/* ===== 검색: 동의어 사전 · 관련도 점수 · 자동완성 ===== */
/* 유사어는 검색 범위를 넓히는 데만 씁니다. 정책의 지원 자격 판정(evaluate)에는 쓰지 않습니다. */
const SYN = [
  ["농기계", "농업기계", "농기구", "농업 장비", "농작업 대행"],
  ["땅", "농지", "토지", "경작지", "농지은행", "임대농지"],
  ["돈", "자금", "융자", "보조금", "지원금", "정착지원금", "이자", "대출"],
  ["집", "주거", "주택", "정착", "귀농인의 집", "임시거주"],
  ["교육", "영농교육", "농업교육", "창업교육", "아카데미", "교육과정", "대학"],
  ["창업", "영농창업", "신규농업인", "신규농", "청년농", "예비농"],
  ["스마트팜", "스마트농업", "시설원예", "ICT"],
  ["판로", "유통", "판매", "마케팅", "직거래", "로컬푸드"],
  ["기술", "영농기술", "컨설팅", "멘토링", "현장실습"],
  ["네트워크", "지역사회", "공동체", "모임", "네트워킹"]
];
const nz = t => String(t || "").toLowerCase().replace(/\s+/g, "");
/* 한 글자 말(땅·돈·집)은 "모집"처럼 다른 낱말 속에 섞여 잘못 걸리므로, 유사어가 있으면 유사어로만 찾습니다. */
const SYNRAW = {}; SYN.flat().forEach(w => SYNRAW[nz(w)] = w);
function expandTok(t) { const k = nz(t); const set = new Set([k]); SYN.forEach(g => { if (g.some(w => nz(w) == k)) g.forEach(w => set.add(nz(w))) }); if (k.length == 1 && set.size > 1) set.delete(k); return [...set] }
/* 확정된 검색어(Enter·버튼) → 토큰별 확장어(QX) + 강조용 정규식(QRE) */
function buildQuery(Q) {
  const QX = Q ? Q.split(/\s+/).filter(Boolean).map(t => ({ t: nz(t), words: expandTok(t) })) : [];
  /* 검색어·유사어 강조: 띄어쓰기가 달라도 맞도록 글자 사이에 공백을 허용한 정규식 */
  const ws = [...new Set(QX.flatMap(x => x.words))].filter(Boolean).sort((a, b) => b.length - a.length);
  const QRE = ws.length ? new RegExp("(" + ws.map(w => [...w].map(c => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s*")).join("|") + ")", "gi") : null;
  return { QX, QRE };
}
function sFields(p) { return p._sf || (p._sf = { ti: nz(p.title), ca: nz(p.category.join(" ") + " " + p.supportType.join(" ")), or: nz(p.organization + " " + (p.sourceName || "")), de: nz(p.description + " " + p.eligibilityDetails.join(" ") + " " + p.eligibleFarmerTypes.join(" ")) }) }
/* 모든 토큰이 (원래 말 또는 유사어로) 어딘가에 있어야 결과에 포함. 점수: 정책명 > 분야·지원 유형 > 기관 > 설명. 원래 말은 유사어보다 높게. */
function qScore(p, QX) {
  if (!QX.length) return 1; const f = sFields(p); let tot = 0;
  for (const x of QX) { let best = 0; for (const w of x.words) { const m = w == x.t ? 1 : .6; const s = (f.ti.includes(w) ? 10 : 0) || (f.ca.includes(w) ? 6 : 0) || (f.or.includes(w) ? 4 : 0) || (f.de.includes(w) ? 2 : 0); if (s * m > best) best = s * m } if (!best) return 0; tot += best } return tot
}
/* 원본은 HTML 문자열을 이어 붙여 텍스트가 하나의 텍스트 노드였습니다. JSX에서 `글자 {값} 글자`로 쓰면 텍스트 노드가
   여러 개로 나뉘어 자간·줄바꿈 위치가 미세하게 달라지므로, 이웃한 문자열은 하나로 합쳐서 렌더링합니다. */
function mix(...parts) {
  const out = [];
  for (const p of parts.flat(Infinity)) {
    if (p == null || p === false || p === "") continue;
    if (typeof p == "string" || typeof p == "number") { if (typeof out[out.length - 1] == "string") out[out.length - 1] += String(p); else out.push(String(p)) }
    else out.push(p);
  }
  return out.map((p, i) => typeof p == "string" ? <Fragment key={i}>{p}</Fragment> : <Fragment key={i}>{p}</Fragment>);
}
/* 검색어 강조: 문자열과 <mark> 조각 배열 (mix로 감싸서 렌더링) */
function hlParts(t, QRE) {
  t = String(t ?? ""); if (!QRE) return [t];
  return t.split(QRE).map((s, i) => i % 2 ? <mark className="qh">{s}</mark> : s);
}
const hl = (t, QRE) => mix(hlParts(t, QRE));
function qsnip(p, QRE) {
  if (!QRE) return null; if (new RegExp(QRE.source, "i").test(p.title)) return null;
  const src = [p.description, ...p.eligibilityDetails, p.organization, p.category.join(" · "), p.supportType.join(" · ")];
  for (const t of src) { const m = new RegExp(QRE.source, "i").exec(t || ""); if (m) { const a = Math.max(0, m.index - 28), b = Math.min(t.length, m.index + m[0].length + 40); return <div className="qsnip"><span className="k">검색어 일치</span>{mix(a > 0 ? "…" : "", hlParts(t.slice(a, b), QRE), b < t.length ? "…" : "")}</div> } }
  return null
}
/* 자동완성: 실제 정책명 + 동의어 사전 + 지원 분야에서만 추천 */
const ACW = [...new Set([...SYN.flat(), ...CATS])];
function acBuild(v) {
  const k = nz(v); if (!k) return []; const hit = (s) => nz(s).indexOf(k);
  const kw = ACW.map(w => ({ v: w, kind: "검색어", i: hit(w) })).filter(o => o.i >= 0);
  const syn = SYN.filter(g => g.some(w => nz(w) == k)).flat().filter(w => nz(w) != k).map(w => ({ v: w, kind: "유사어", i: 99 }));
  const pol = P.map(p => ({ v: p.title, kind: "정책", i: hit(p.title) })).filter(o => o.i >= 0);
  const seen = new Set(), out = []; for (const o of [...kw.sort((a, b) => a.i - b.i || a.v.length - b.v.length), ...pol.sort((a, b) => a.i - b.i), ...syn]) { if (seen.has(o.v)) continue; seen.add(o.v); out.push(o); if (out.length == 5) break } return out
}
function acMark(t, v) { const k = v.trim(); const i = k ? t.toLowerCase().indexOf(k.toLowerCase()) : -1; return i < 0 ? t : <>{t.slice(0, i)}<mark>{t.slice(i, i + k.length)}</mark>{t.slice(i + k.length)}</> }

const LBL = { ok: ["기본 조건 일치", "ok"], unknown: ["추가 확인 필요", "chk"], no: ["조건 불일치", "no"] }, CL = { ok: "일치", unknown: "확인 필요", no: "불일치" };
function range(a, b, u) { return a == null && b == null ? "명시 없음" : (a ?? "") + "~" + (b ?? "") + u }

/* ===== 선배가 해보니 ===== */
const RK = ["신청이 쉬워요", "서류가 복잡해요", "설명이 친절해요", "지원이 도움됐어요", "준비 기간이 길어요", "자격 확인이 어려워요"], POS = [0, 2, 3], NEG = [1, 4, 5];
const RKOLD = { "신청 쉬움": "신청이 쉬워요", "서류 복잡": "서류가 복잡해요", "설명 친절": "설명이 친절해요", "지원 도움": "지원이 도움됐어요", "준비 기간 김": "준비 기간이 길어요", "자격 확인 어려움": "자격 확인이 어려워요" }, rkfix = a => Array.isArray(a) ? a.map(k => RKOLD[k] || k) : a;
const RV_DEFAULT = { open: false, fs: 0, fk: "", sort: "new", n: 5, star: 0, kw: [], draft: "", write: false, msg: "", busy: false };
/* 통계: 해당 정책 후기만 사용. 비율 = 키워드 선택 인원 / 전체 후기 작성자 */
function rvStats(list) { const n = list.length, avg = n ? list.reduce((a, r) => a + r.rating, 0) / n : 0, kc = RK.map(k => ({ k, c: list.filter(r => r.keywords.includes(k)).length })); return { n, avg, kc, top: [...kc].sort((a, b) => b.c - a.c).filter(x => x.c > 0).slice(0, 4) } }
/* 서버 AI API 미연결: 키워드 빈도 기반 요약 */
function rvSummary(st) {
  if (st.n < 3) return "요약할 후기가 부족합니다"; const pc = x => Math.round(x.c / st.n * 100), pick = a => a.map(i => st.kc[i]).sort((x, y) => y.c - x.c)[0], p = pick(POS), q = pick(NEG), o = [];
  if (p.c) o.push(`후기 작성자의 ${pc(p)}%가 '${p.k}'를 선택했습니다.`); if (q.c) o.push(`다만 ${pc(q)}%는 '${q.k}'를 선택했습니다.`); o.push(`평균 별점은 ${st.avg.toFixed(1)}점입니다.`); return o.slice(0, 3).join(" ")
}
const stars = n => "★".repeat(n) + "☆".repeat(5 - n);

/* ===== 신청 달력 ===== */
const pad2 = n => String(n).padStart(2, "0");
const ccat = p => ((p.category || [])[0] || "기타").replace("네트워크(지역사회 관계)", "네트워크");

/* ===== 홈 · 아이콘 ===== */
const ICO = {
  list: <path d="M4 6h16M4 12h16M4 18h10" />,
  cond: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  cal: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>,
  fav: <path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z" />,
  rec: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></>,
  srcs: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
};
const svg = (k, size = 22) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICO[k]}</svg>;
const HOME_MENU = [["list", "정책 모아보기", `제주 청년농이 활용할 수 있는 지원사업 분야·신청 상태별 검색`], ["cond", "내 조건 설정", "나이·지역·영농경력·경영체 등록 여부로 맞춤 정책 확인"], ["cal", "신청 달력", "접수 시작일·마감일 달력, 날짜별 일정"], ["fav", "관심 정책", "☆로 담아 둔 정책 모아보기"], ["rec", "신청 기록", "관심 있음부터 결과 확인까지 진행 상태 기록"], ["srcs", "공식 공고 바로가기", "도청·시청·농업기술센터 등 공식 공고 사이트 연결"]];
const HOME_STEPS = [["내 조건 입력", "만 나이·영농 지역·영농경력·농업경영체 등록 여부 입력 (이 기기에만 저장)"], ["맞춤 정책 확인", "정책 카드 배지로 '기본 조건 일치' 확인, 분야·신청 상태로 범위 좁히기"], ["자세히 보고 준비", "자격·준비 서류 체크, 선배 후기 참고 후 공식 공고문에서 최종 확인"], ["일정 관리", "☆ 관심 정책 담기, 신청 달력·신청 기록으로 마감과 진행 상황 관리"]];
const HOME_PILLARS = [["한곳에 모은 공고", "농식품부·도청·시청·농업기술원 등 공고를 한 화면에서 제공"], ["나에게 맞는 것부터", "네 가지 조건으로 일치·확인 필요·불일치 즉시 표시"], ["공식 출처 확인", "모든 정책에 출처·확인일 표기, 공고문 바로 연결"]];

/* ===== 메뉴 안내판 (마우스를 올리면 기능 요약) ===== */
const MEGA = {
  list: ["정책 모아보기", "제주 청년농이 활용할 수 있는 지원사업 통합 검색·비교", [
    ["q", "정책 검색", "정책명·기관·자격 요건·분야 키워드 검색"], ["cats", "분야별 보기", "농지·초기자금·판로·영농기술·네트워크·주거 분야별 보기"], ["sts", "신청 상태로 좁히기", "모집 중·마감 임박·접수 예정·마감·확인 필요 상태별 보기"],
    ["due", "마감 임박순 정렬", "마감이 가까운 순 정렬, 마감 정책 숨기기"], ["list", "정책 상세", "자격·준비 서류 체크리스트·공식 신청 링크 확인"], ["list", "선배가 해보니", "먼저 신청한 사람들의 별점·키워드 후기"]]],
  cal: ["신청 달력", "접수 시작일·마감일 달력 확인", [
    ["cal", "월별 일정", "이번 달 접수 시작·마감 일정 한눈에 보기"], ["cal", "날짜별 일정 보기", "선택한 날짜의 시작·마감 정책 보기"], ["cal", "마감일 미정 정책", "신청 기간 미확인 정책 모아보기"]]],
  rec: ["신청 기록", "정책별 진행 상태 기록·단계별 모아보기", [
    ["rec", "진행 상태 기록", "관심 있음 → 신청 준비 중 → 신청 완료 → 결과 확인 4단계 기록"], ["rec", "상태별 모아보기", "기록한 정책의 진행 단계별 보기"], ["rec", "기록 변경·삭제", "진행 상태 변경, 기록 삭제"]]],
  fav: ["관심 정책", "☆로 담아 둔 정책 모아보기", [
    ["list", "관심 정책 담기", "정책 카드의 ☆ 관심 버튼으로 담기"], ["fav", "관심 목록 보기", "담은 정책의 기관·마감일·남은 날짜 확인"], ["fav", "상세로 바로 이동", "정책명을 눌러 상세 바로 열기"]]],
  cond: ["내 조건 설정", "내 상황에 맞는 정책 우선 표시 (조건은 이 기기에만 저장)", [
    ["cond", "네 가지 조건 입력", "만 나이·영농 지역·영농경력·농업경영체 등록 여부 입력"], ["cond", "자격 판정 배지", "기본 조건 일치·추가 확인 필요·조건 불일치 표시"], ["cond", "선택한 조건 관리", "입력 조건 태그 표시, 개별 삭제·전체 초기화"],
    ["srcs", "공식 공고 바로가기", "도청·시청·농업기술센터 등 공식 공고 사이트 연결"]]]
};
const NAV = [["navpol", "list", "정책 모아보기"], ["navcal", "cal", "신청 달력"], ["navrec", "rec", "신청 기록"], ["navfav", "fav", "관심 정책"], ["navcond", "cond", "내 조건 설정"]];
const NAV_VIEW = { navpol: "list", navcal: "cal", navrec: "rec", navfav: "fav" };
const canHover = window.matchMedia && matchMedia("(hover:hover)").matches;

/* ===== 관심 정책 · 신청 기록 ===== */
const RS = ["관심 있음", "신청 준비 중", "신청 완료", "결과 확인"];
function rowMeta(p) { return p.organization + " · 마감 " + (p.applicationEnd || "확인 필요") + (p.applicationEnd && status(p) != "마감" ? " (D-" + dday(p) + ")" : "") }

const SOURCES = [
  ["https://www.jejusi.go.kr/field/economy/youngfarmer.do", "제주 청년농업인 정책 알리미 (제주시)"],
  ["https://agri.jeju.go.kr/agri/notice/job/2023.htm", "농업기술원 공고"],
  ["https://agri.jeju.go.kr/seogwipo/notice/notice.htm", "서귀포농업기술센터 공지"],
  ["https://agri.jeju.go.kr/jeju/notice/notice.htm", "제주농업기술센터 공지"],
  ["https://agri.jeju.go.kr/dongbu/notice/notice.htm", "동부농업기술센터 공지"],
  ["https://agri.jeju.go.kr/seobu/index.htm", "서부농업기술센터"],
  ["https://jejuyouthdream.com/policy/finder?policyWay=%EC%A0%84%EC%B2%B4&page=1&searchKeyword=%EC%B2%AD%EB%85%84%EB%86%8D", "제주청년플랫폼 청년이어드림 (청년농 검색)"],
  ["https://agriedu.net/", "농업교육포털"],
  ["https://www.gov.kr", "정부24"],
];

/* ---- 시작 시 저장값 불러오기 (원본과 같은 키·같은 보정) ---- */
const INIT = (() => {
  const S = ls.get("bmy", { ...EMPTY_S }); if (S.biz == null) S.biz = "";
  S.cats = (S.cats || []).filter(c => CATS.includes(c)); S.sts = (S.sts || []).filter(c => STS.includes(c));
  const UR = ls.get("bmy_rv", []).map(r => r && typeof r == "object" ? { ...r, keywords: rkfix(r.keywords) } : r);
  let UID = ls.get("bmy_uid", null); if (!UID) { UID = "u" + Math.random().toString(36).slice(2, 9); ls.set("bmy_uid", UID) }
  return { S, fav: ls.get("bmy_fav", []), docs: ls.get("bmy_docs", {}), UR, UID, REC: ls.get("bmy_rec", {}) };
})();
const UID = INIT.UID;

export default function App() {
  const [S, setS] = useState(INIT.S);
  const [fav, setFav] = useState(INIT.fav);
  const [docs, setDocs] = useState(INIT.docs);
  const [REC, setREC] = useState(INIT.REC);
  const [UR, setUR] = useState(INIT.UR);
  const [RV, setRV] = useState({});
  const [open, setOpen] = useState(null);
  const [pg, setPg] = useState(1);
  const [jump, setJump] = useState(false);
  const [qInput, setQInput] = useState("");
  const [Q, setQ] = useState("");
  const [sort, setSort] = useState("fit");
  const [hide, setHide] = useState(() => syncHideOf(INIT.S));
  const [hideend, setHideend] = useState(false);
  const [view, setView] = useState("home");
  const [calY, setCalY] = useState(TODAY.getFullYear());
  const [calM, setCalM] = useState(TODAY.getMonth());
  const [calSel, setCalSel] = useState(null);
  const [calAll, setCalAll] = useState(false);
  const [ac, setAc] = useState({ items: [], i: -1, mv: "" });
  const [megaKey, setMegaKey] = useState(null);
  /* 원본은 render()마다 목록 innerHTML을 새로 만들어 열린 상세(.ex)의 등장 애니메이션이 다시 재생됐습니다.
     같은 효과를 내기 위해 render()가 불리던 시점마다 tick을 올리고 .ex의 key로 씁니다. */
  const [tick, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);

  const acT = useRef(null), megaT = useRef(null), megaKeyRef = useRef(null), qInputRef = useRef("");
  const navRef = useRef(null), navLinks = useRef({}), qRef = useRef(null), ageRef = useRef(null), topPanelRef = useRef(null), srcsRef = useRef(null), barRef = useRef(null), listRef = useRef(null);
  const cardRefs = useRef({}), openBtnRefs = useRef({}), dayRefs = useRef({}), cpxRef = useRef(null), catsRef = useRef(null), stsRef = useRef(null);
  qInputRef.current = qInput;

  const { QX, QRE } = buildQuery(Q);
  const u = { age: S.age === "" ? null : +S.age, region: S.region, exp: S.exp === "" ? null : +S.exp, biz: S.biz === "" ? null : S.biz === "1" };

  function syncHideOf(s) { return s.age !== "" || !!s.region || s.exp !== "" || s.biz !== "" }
  const saveS = s => ls.set("bmy", s);

  /* ---- 목록 계산 (원본 render()의 계산 부분) ---- */
  let L = P.map(p => ({ p, e: evaluate(p, u), st: status(p), qs: 0 })).filter(x => (!S.cats.length || x.p.category.some(c => S.cats.includes(c))) && (!S.sts.length || S.sts.includes(x.st)) && (x.qs = qScore(x.p, QX)) > 0);
  if (hide) L = L.filter(x => x.e.overall != "no"); if (hideend) L = L.filter(x => x.st != "마감");
  {
    const rank = { ok: 0, unknown: 1, no: 2 }, so = sort;
    const end = p => p.applicationEnd ? +new Date(p.applicationEnd) : Infinity;
    L.sort((a, b) => { const c = (a.st == "마감") - (b.st == "마감"); if (c) return c; if (so == "due") { if (a.st == "마감") return end(b.p) - end(a.p); return end(a.p) - end(b.p) } if (so == "new") return (b.p.reg || "").localeCompare(a.p.reg || ""); return rank[a.e.overall] - rank[b.e.overall] || (QX.length ? b.qs - a.qs : 0) || b.e.score - a.e.score });
  }
  /* 쪽 번호 보정: 원본처럼 보정된 값을 그대로 유지합니다 (렌더 중 setState 패턴) */
  let page = pg;
  if (jump && open) { const i = L.findIndex(x => x.p.id == open); if (i >= 0) page = Math.floor(i / PER) + 1 }
  const tp = Math.max(1, Math.ceil(L.length / PER)); if (page > tp) page = tp; if (page < 1) page = 1;
  if (page !== pg) setPg(page);
  if (jump && open) setJump(false);

  const allSt = P.map(status);
  const syn = [...new Set(QX.flatMap(x => x.words.filter(w => w != x.t).map(w => SYNRAW[w] || w)))];

  /* ---- 화면 전환 ---- */
  useLayoutEffect(() => { document.body.dataset.view = view }, [view]);
  useLayoutEffect(() => { window.scrollTo({ top: 0 }) }, []);
  /* setView(v): 상태를 즉시 반영한 뒤, 목록이 아니면 맨 위로 이동 (원본 setView와 같은 순서) */
  function goView(v, extra) {
    flushSync(() => { setView(v); extra && extra() });
    if (v != "list") window.scrollTo({ top: 0 });
  }
  const toListTop = () => { if (barRef.current) barRef.current.scrollIntoView({ behavior: "smooth", block: "start" }) };

  /* ---- 메뉴 안내판 ---- */
  function showMega(k) { clearTimeout(megaT.current); if (megaKeyRef.current === k) return; megaKeyRef.current = k; setMegaKey(k) }
  function hideMega(now) { clearTimeout(megaT.current); const go = () => { megaKeyRef.current = null; setMegaKey(null) }; now ? go() : megaT.current = setTimeout(go, 180) }

  /* ---- 자동완성 ---- */
  function acClose() { clearTimeout(acT.current); setAc({ items: [], i: -1, mv: "" }) }
  function acShow(items, i) { if (!items.length) { acClose(); return } setAc({ items, i, mv: qInputRef.current }) }
  const acOpen = ac.items.length > 0;

  /* ---- 동작 ---- */
  function doSearch(value = qInput) {
    acClose(); flushSync(() => { setQ(value.trim()); setPg(1); if (view != "list") setView("list"); bump() });
    toListTop();
  }
  function acPick(i) { const o = ac.items[i]; if (!o) return; setQInput(o.v); doSearch(o.v) }
  function onQChange(e) {
    const v = e.target.value; setQInput(v); clearTimeout(acT.current);
    if (!v.trim()) { acClose(); if (Q) setQ("") }
    else acT.current = setTimeout(() => { acShow(acBuild(v), -1) }, 250);
    setPg(1); bump();
  }
  function onQKeyDown(e) {
    if (e.nativeEvent.isComposing) return; const isOpen = acOpen;
    if (e.key == "ArrowDown" && isOpen) { e.preventDefault(); acShow(ac.items, (ac.i + 1) % ac.items.length) }
    else if (e.key == "ArrowUp" && isOpen) { e.preventDefault(); acShow(ac.items, (ac.i - 1 + ac.items.length) % ac.items.length) }
    else if (e.key == "Escape" && isOpen) { e.preventDefault(); acClose() }
    else if (e.key == "Enter") { e.preventDefault(); if (isOpen && ac.i >= 0) acPick(ac.i); else doSearch() }
  }
  function onCondChange(field, e) {
    const v = e.target.value;
    /* 원본 render()는 매번 입력칸 값을 S로 다시 써서, 숫자가 아닌 입력(예: "1e")은 지워졌습니다 */
    if (field == "age") e.target.value = v;
    const nS = { ...S, [field]: v }; setPg(1); setS(nS); setHide(syncHideOf(nS)); saveS(nS); bump();
  }
  function onHeroCta(e) { e.preventDefault(); goView("list", () => { setSort("fit"); setPg(1); bump() }); window.scrollTo({ top: 0, behavior: "smooth" }) }
  function onSortGo(e, v) { e.preventDefault(); hideMega(true); flushSync(() => { if (view != "list") setView("list"); if (v) setSort(v); setPg(1); bump() }); toListTop() }
  function onPage(e, n, disabled) { if (disabled) return; flushSync(() => { setPg(n); bump() }); toListTop() }
  function toggleChip(key, v) { const a = S[key]; const nS = { ...S, [key]: a.includes(v) ? a.filter(i => i != v) : [...a, v] }; setPg(1); setS(nS); saveS(nS); bump() }
  function removeTag(r) {
    let nS; if (r.includes(":")) { const [k, v] = r.split(":"); nS = { ...S, [k]: S[k].filter(i => i != v) } } else nS = { ...S, [r]: "" };
    setPg(1); setS(nS); setHide(syncHideOf(nS)); saveS(nS); bump()
  }
  function resetAll() { const nS = { ...EMPTY_S, cats: [], sts: [] }; setPg(1); setS(nS); setQInput(""); setQ(""); setHide(false); saveS(nS); bump() }
  function clearQuery() { setPg(1); setQInput(""); setQ(""); saveS(S); bump() }
  function toggleOpen(id) { setOpen(o => o == id ? null : id); saveS(S); bump() }
  function toggleFav(id) { const nf = fav.includes(id) ? fav.filter(x => x != id) : [...fav, id]; setFav(nf); ls.set("bmy_fav", nf); saveS(S); bump() }
  function toggleRec(id, v) { const n = { ...REC }; if (n[id] == v) delete n[id]; else n[id] = v; setREC(n); ls.set("bmy_rec", n); bump() }
  function toggleDoc(k, checked) { const n = { ...docs, [k]: checked }; setDocs(n); ls.set("bmy_docs", n) }
  function goCond(e) {
    e.preventDefault(); if (view != "list") goView("list");
    topPanelRef.current.scrollIntoView({ behavior: "smooth" }); ageRef.current.focus({ preventScroll: true });
  }
  function goHome(g) { /* data-go */
    if (g == "cond" || g == "srcs") { goView("list"); (g == "cond" ? topPanelRef : srcsRef).current.scrollIntoView({ behavior: "smooth" }); if (g == "cond") ageRef.current.focus({ preventScroll: true }) }
    else goView(g)
  }
  /* data-cal: 정책명을 누르면 목록으로 가서 해당 카드를 펼침 */
  function openPolicy(id) {
    const nS = { ...S, cats: [], sts: [] };
    goView("list", () => { setOpen(id); setJump(true); setS(nS); setQInput(""); setQ(""); setHide(false); setHideend(false); bump() });
    saveS(nS);
    const c = cardRefs.current[id]; if (c) { c.scrollIntoView({ behavior: "smooth", block: "start" }); const b = openBtnRefs.current[id]; if (b) b.focus({ preventScroll: true }) }
  }
  function onMegaGo(e, g) {
    e.preventDefault(); hideMega(true);
    if (["cal", "rec", "fav"].includes(g)) { goView(g); return }
    goView("list");
    if (g == "list") { window.scrollTo({ top: 0, behavior: "smooth" }); return }
    if (g == "due") { flushSync(() => { setSort("due"); setPg(1); bump() }); barRef.current.scrollIntoView({ behavior: "smooth" }) }
    else if (g == "q") { qRef.current.focus() }
    else { const el = g == "srcs" ? srcsRef.current : topPanelRef.current; el.scrollIntoView({ behavior: "smooth" }); const f = g == "cats" ? catsRef.current.querySelector("button") : g == "sts" ? stsRef.current.querySelector("button") : g == "cond" ? ageRef.current : null; if (f) f.focus({ preventScroll: true }) }
  }
  function onNavClick(e, id) {
    e.preventDefault();
    if (id == "navcond") goCond(e); else goView(NAV_VIEW[id]);
    hideMega(true);
  }

  /* ---- 달력 ---- */
  function calNav(d0) { const d = new Date(calY, calM + d0, 1); setCalY(d.getFullYear()); setCalM(d.getMonth()); setCalSel(null) }
  function calDay(k) {
    const ns = calSel == k ? null : k; flushSync(() => setCalSel(ns));
    const f = ns ? cpxRef.current : dayRefs.current[k]; if (f) f.focus({ preventScroll: true });
  }
  function calClose() { const k = calSel; flushSync(() => setCalSel(null)); const b = dayRefs.current[k]; if (b) b.focus({ preventScroll: true }) }

  /* ---- 후기 ---- */
  const rs = pid => RV[pid] || RV_DEFAULT;
  const revs = pid => UR.filter(r => r.policyId == pid);
  function rvAct(a, pid, v) {
    const s = { ...rs(pid), msg: "" }; let nUR = null;
    if (a == "open") s.open = !s.open; else if (a == "write") { s.write = !s.write; const m = revs(pid).find(r => r.authorId == UID); if (s.write && m && !s.draft) { s.star = m.rating; s.kw = [...m.keywords]; s.draft = m.content } } else if (a == "fs") { s.fs = +v; s.n = 5 } else if (a == "fk") { s.fk = s.fk == v ? "" : v; s.n = 5 } else if (a == "sort") { s.sort = v; s.n = 5 } else if (a == "more") s.n += 5; else if (a == "star") s.star = +v;
    else if (a == "kw") { s.kw = s.kw.includes(v) ? s.kw.filter(k => k != v) : s.kw.length < 3 ? [...s.kw, v] : s.kw }
    else if (a == "submit") {
      const c = s.draft.trim();
      if (!s.star || c.length < 5) s.msg = "별점과 5자 이상의 후기를 입력해 주십시오.";
      else {
        const d = ymd(new Date()), ex = UR.find(r => r.policyId == pid && r.authorId == UID), rec = { rating: s.star, keywords: s.kw, content: c, createdAt: ex ? ex.createdAt : d, updatedAt: d };
        nUR = ex ? UR.map(r => r === ex ? { ...r, ...rec } : r) : [...UR, { id: "r" + Date.now(), policyId: pid, authorId: UID, ...rec }];
        Object.assign(s, { write: false, star: 0, kw: [], draft: "", open: true, fs: 0, fk: "", sort: "new", n: 5, msg: ex ? "후기가 수정되었습니다. 통계와 요약이 갱신되었습니다." : "후기가 등록되었습니다. 통계와 요약이 갱신되었습니다." })
      }
    }
    else if (a == "del") { nUR = UR.filter(r => !(r.policyId == pid && r.authorId == UID)); s.msg = "후기를 삭제했습니다." }
    if (nUR) { setUR(nUR); ls.set("bmy_rv", nUR) }
    setRV(m => ({ ...m, [pid]: s })); bump();
  }
  const setDraft = (pid, v) => setRV(m => ({ ...m, [pid]: { ...(m[pid] || RV_DEFAULT), draft: v } }));

  /* ---- document 단위 이벤트 (원본에서도 document에 걸려 있던 것들) ---- */
  const live = useRef(); live.current = { view, calSel, hideMega };
  useEffect(() => {
    /* 달력 바깥 클릭 시 팝업 닫기. 원본에서 이 리스너보다 먼저 등록돼 화면을 바꾸던 버튼(#herocta, [data-sortgo], #navcond, #navfav)은
       누른 시점에 이미 달력 화면이 아니게 되어 팝업이 닫히지 않았으므로 똑같이 제외합니다. */
    const onClickCapture = e => {
      const { view, calSel } = live.current;
      if (view == "cal" && calSel && !e.target.closest(".calpop,[data-calday],[data-calnav]") && !e.target.closest("#herocta,[data-sortgo],#navcond,#navfav")) setCalSel(null);
    };
    const onKeyDown = e => {
      const { view, calSel, hideMega } = live.current;
      if (e.key == "Escape" && view == "cal" && calSel) { flushSync(() => setCalSel(null)); const b = dayRefs.current[calSel]; if (b) b.focus() }
      if (e.key == "Escape" && megaKeyRef.current) { const a = navLinks.current[megaKeyRef.current]; hideMega(true); if (a) a.focus() }
    };
    const onFocusIn = e => { if (megaKeyRef.current && !navRef.current.contains(e.target)) live.current.hideMega(true) };
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => { document.removeEventListener("click", onClickCapture, true); document.removeEventListener("keydown", onKeyDown); document.removeEventListener("focusin", onFocusIn) };
  }, []);

  /* ================= 렌더 ================= */
  const main = view == "list";

  const tags = []; if (S.age !== "") tags.push(["age", `만 ${S.age}세`]); if (S.region) tags.push(["region", S.region]); if (S.exp !== "") tags.push(["exp", EXPL[S.exp]]); if (S.biz !== "") tags.push(["biz", S.biz === "1" ? "경영체 등록" : "경영체 미등록"]); S.cats.forEach(c => tags.push(["cats:" + c, c])); S.sts.forEach(c => tags.push(["sts:" + c, c]));

  function renderPager() {
    if (tp <= 1) return null;
    let nums = []; if (tp <= 7) { for (let i = 1; i <= tp; i++)nums.push(i) } else if (page <= 4) nums = [1, 2, 3, 4, 5, tp]; else if (page >= tp - 3) nums = [1, tp - 4, tp - 3, tp - 2, tp - 1, tp]; else nums = [1, page - 1, page, page + 1, tp];
    const out = [<button key="prev" data-page={page - 1} aria-disabled={page == 1} aria-label="이전 페이지" onClick={e => onPage(e, page - 1, page == 1)}>‹<span className="pt"> 이전</span></button>]; let prev = 0;
    nums.forEach(n => { if (n - prev > 1) out.push(<span key={"g" + n} className="gap" aria-hidden="true">…</span>); out.push(<button key={n} data-page={n} aria-current={n == page ? "page" : undefined} aria-label={`${n}페이지`} onClick={e => onPage(e, n, false)}>{n}</button>); prev = n });
    out.push(<button key="next" data-page={page + 1} aria-disabled={page == tp} aria-label="다음 페이지" onClick={e => onPage(e, page + 1, page == tp)}><span className="pt">다음 </span>›</button>);
    return out;
  }

  function rvSection(p) {
    const s = rs(p.id), all = revs(p.id), st = rvStats(all), mine = all.find(r => r.authorId == UID);
    let list = null;
    if (s.open && st.n) {
      list = all.filter(r => (!s.fs || r.rating == s.fs) && (!s.fk || r.keywords.includes(s.fk)));
      list.sort((a, b) => s.sort == "hi" ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt) : s.sort == "lo" ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt));
    }
    const act = (a, v) => () => rvAct(a, p.id, v);
    return <section className="rv"><h4>선배가 해보니</h4>
      {!st.n ? <div className="meta">등록된 후기 없음. 첫 후기를 남겨 주십시오.</div>
        : <><div><span className="big">{`★ ${st.avg.toFixed(1)}`}</span><span className="meta">{`/ 5 · 후기 ${st.n}개`}</span></div>
          {st.top.map(x => <div className="bar2" key={x.k}><span>{x.k}</span><span className="bt" role="img" aria-label={`${Math.round(x.c / st.n * 100)}%`}><i style={{ width: `${x.c / st.n * 100}%` }}></i></span><span className="bn">{`${x.c}명 · ${Math.round(x.c / st.n * 100)}%`}</span></div>)}
          <div className="rvs">{rvSummary(st)}<div className="note">키워드 빈도 기반 요약 (AI 요약 아님). 후기는 사용자 경험이며 공식 정책 정보가 아닙니다.</div></div></>}
      <button className="btn s" aria-expanded={s.open} hidden={!st.n} onClick={act("open")}>{s.open ? "접기" : "자세히 보기"}</button>
      <button className="btn s" onClick={act("write")}>{s.write ? "작성 취소" : mine ? "내 후기 수정" : "후기 쓰기"}</button>
      {mine ? <button className="btn s" disabled={s.busy} onClick={act("del")}>내 후기 삭제</button> : null}
      {s.msg ? <div className="note" role="status">{s.msg}</div> : null}
      {s.write ? <div className="rvi"><b>별점</b><div className="chips">{[1, 2, 3, 4, 5].map(n => <button key={n} className="chip" aria-pressed={s.star == n} onClick={act("star", n)}>{`${n}점`}</button>)}</div>
        <div style={{ marginTop: 12 }}><b>키워드</b> <span className="meta">(최대 3개)</span></div>
        <div className="chips">{RK.map(k => <button key={k} className="chip" aria-pressed={s.kw.includes(k)} onClick={act("kw", k)}>{k}</button>)}</div>
        <label htmlFor={`d-${p.id}`} style={{ marginTop: 12 }}>후기 (5자 이상)</label><textarea id={`d-${p.id}`} maxLength={500} value={s.draft} onChange={e => setDraft(p.id, e.target.value)}></textarea>
        <button className="btn" disabled={s.busy} onClick={act("submit")}>{s.busy ? "저장 중…" : "후기 등록"}</button>
        <div className="note">공유 저장소에 연결되지 않아 후기는 이 기기(localStorage)에만 저장되고, 다른 사람에게는 보이지 않습니다. 같은 기기에서 다시 등록하면 기존 후기가 수정됩니다.</div></div> : null}
      {list ? <>
        <div className="chips" role="group" aria-label="별점 필터">{[0, 5, 4, 3, 2, 1].map(n => <button key={n} className="chip" aria-pressed={s.fs == n} onClick={act("fs", n)}>{n ? n + "점" : "전체"}</button>)}</div>
        <div className="chips" role="group" aria-label="키워드 필터">{RK.map(k => <button key={k} className="chip" aria-pressed={s.fk == k} onClick={act("fk", k)}>{k}</button>)}</div>
        <div className="chips" role="group" aria-label="정렬">{[["new", "최신순"], ["hi", "별점 높은순"], ["lo", "별점 낮은순"]].map(x => <button key={x[0]} className="chip" aria-pressed={s.sort == x[0]} onClick={act("sort", x[0])}>{x[1]}</button>)}</div>
        <div className="meta" style={{ marginTop: 12 }} aria-live="polite">{`후기 ${list.length}개`}</div>
        {list.length ? list.slice(0, s.n).map(r => <div className="rvi" key={r.id}><span className="st" role="img" aria-label={`별점 ${r.rating}점`}>{stars(r.rating)}</span>{" "}<span className="meta">{r.createdAt + (r.updatedAt != r.createdAt ? " (수정 " + r.updatedAt + ")" : "")}</span>{r.authorId == UID ? <>{" "}<span className="badge ok">내 후기</span></> : null}<div className="chips" style={{ marginTop: 8 }}>{r.keywords.map(k => <span className="tag" key={k}>{k}</span>)}</div><p>{r.content}</p></div>)
          : <div className="empty">조건에 맞는 후기 없음. 필터를 바꿔 보십시오.</div>}
        {list.length > s.n ? <button className="btn s" onClick={act("more")}>{`후기 더 보기 (${list.length - s.n}개 남음)`}</button> : null}
      </> : null}
    </section>
  }

  function recBlock(p) {
    return <><h4>신청 기록</h4><div className="chips" role="group" aria-label="신청 기록">{RS.map(s => <button key={s} className="chip" aria-pressed={REC[p.id] == s} onClick={() => toggleRec(p.id, s)}>{s}</button>)}</div><div className="note">직접 고르는 진행 상태 (다시 누르면 기록 삭제, 이 기기에만 저장)</div></>
  }

  function card(x) {
    const p = x.p, o = open == p.id, b = LBL[x.e.overall], d = p.applicationEnd ? dday(p) : null;
    const dl = x.st == "마감" || x.st == "접수 예정" || x.st == "확인 필요" ? "" : d == 0 ? "D-day" : d != null ? "D-" + d : "";
    const isFav = fav.includes(p.id);
    const extLink = (url, label, s) => url ? <a className={`btn ${s}`} href={url} target="_blank" rel="noopener">{`${label} ↗`}</a> : <a className={`btn ${s}`} aria-disabled="true" style={{ opacity: .45, pointerEvents: "none" }}>{`${label} ↗`}</a>;
    return <article className={`card ${x.e.overall == "no" ? "dim" : ""}`} id={`card-${p.id}`} key={p.id} ref={el => { cardRefs.current[p.id] = el }}>
      <div className="top"><div><span className={`badge ${b[1]}`}>{b[0]}</span><span className={`badge ${x.st == "마감 임박" ? "dd" : "gr"}`}>{`${x.st} ${dl}`}</span><h3>{hl(p.title, QRE)}</h3>
        <div className="meta">{mix(hlParts(p.organization, QRE), " · ", p.eligibleFarmerTypes.join(", ") || "지원 대상 명시 없음")}<br />{mix(`신청 ${p.applicationStart || "?"} ~ ${p.applicationEnd || "?"} · `, hlParts(p.supportType.join("/"), QRE))}</div>{qsnip(p, QRE)}</div>
        <button className="ic" aria-pressed={isFav} aria-label={`관심 정책 ${isFav ? "해제" : "등록"}`} onClick={() => toggleFav(p.id)}>{isFav ? "★ 관심" : "☆ 관심"}</button></div>
      <div className="cact"><button className="btn s" aria-expanded={o} ref={el => { openBtnRefs.current[p.id] = el }} onClick={() => toggleOpen(p.id)}>{o ? "접기" : "자세히 보기"}</button>{p.applicationUrl || p.officialNoticeUrl ? <a className="btn s" href={p.applicationUrl || p.officialNoticeUrl} target="_blank" rel="noopener noreferrer">{`${p.applicationUrl ? "공식 신청 페이지" : "공식 공고문"} ↗`}</a> : <span className="btn s" aria-disabled="true" style={{ opacity: .45, cursor: "default" }}>공식 링크 없음</span>}</div>
      {o ? <div className="ex" key={tick}><p style={{ margin: 0 }}>{hl(p.description, QRE)}</p>
        <div className="ex2"><div className="exc"><h4>신청 대상 및 자격</h4>{p.eligibilityDetails.length ? <ul>{p.eligibilityDetails.map((t, i) => <li key={i}>{hl(t, QRE)}</li>)}</ul> : <div className="meta">공고에 명시된 내용 없음</div>}</div><div className="exc"><h4>내 조건과 비교 <span className="meta">(참고용)</span></h4>
          <table className="cmp"><tbody>{x.e.checks.map(c => <tr key={c[0]}><td>{c[0]}</td><td><span className={`badge ${LBL[c[1]][1]}`}>{CL[c[1]]}</span></td></tr>)}</tbody></table>
          <div className="note">{`정책 기준: 연령 ${range(p.minAge, p.maxAge, "세")} · 영농경력 ${range(p.minFarmingYears, p.maxFarmingYears, "년")} · 지역 ${p.eligibleRegions.join(", ") || "명시 없음"} · 농업경영체 등록 ${p.requiresBusinessRegistration == null ? "명시 없음" : p.requiresBusinessRegistration ? "필요" : "불필요"}. 이 비교는 공식 자격 심사가 아니며, 다른 필수 자격이 있을 수 있습니다.`}</div></div></div>
        <h4>준비 서류 체크리스트</h4>{p.requiredDocuments.length ? <ul>{p.requiredDocuments.map((t, i) => <li className="d" key={i}><label className="doc"><input type="checkbox" checked={!!docs[p.id + ":" + i]} onChange={e => toggleDoc(p.id + ":" + i, e.target.checked)} />{t}</label></li>)}</ul> : <div className="meta">확인된 서류 없음. 공식 공고를 확인하십시오.</div>}
        {rvSection(p)}{recBlock(p)}<h4>참고 링크</h4>
        <div className="links">{extLink(p.applicationUrl, "공식 신청 페이지", p.applicationUrl ? "" : "s")}{extLink(p.officialNoticeUrl, "공식 공고문", "s")}</div>
        <div className="note">{p.applicationUrl || p.officialNoticeUrl ? "외부 사이트로 이동합니다." : "확인된 공식 링크가 없습니다. 아래 참고 링크나 해당 기관 사이트에서 공고를 확인해 주십시오."}</div>{(p.references || []).length ? <ul className="refs">{p.references.map((r, i) => <li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer">{`${r.label} ↗`}</a></li>)}</ul> : null}<div className="note">{`출처: ${p.sourceName} · 확인일 ${p.lastVerifiedAt || "미확인"}`}</div></div> : null}
    </article>
  }

  function renderHome() {
    const all = P.map(p => ({ p, st: status(p) }));
    const op = all.filter(x => ["모집 중", "마감 임박", "접수 예정"].includes(x.st)).sort((a, b) => (a.p.applicationEnd || "9").localeCompare(b.p.applicationEnd || "9"));
    const recent = all.filter(x => !op.includes(x)).sort((a, b) => (b.p.reg || "").localeCompare(a.p.reg || "")), pick = [...op, ...recent].slice(0, 3);
    return <>
      <section className="hsec hs-how" aria-labelledby="how-t"><h2 id="how-t" className="hhow">이렇게 이용하세요<img className="sc-g2" src={CHG} alt="" aria-hidden="true" /></h2><ol className="steps">
        {HOME_STEPS.map(s => <li key={s[0]}><b>{s[0]}</b><span>{s[1]}</span></li>)}</ol>
        <button className="btn" style={{ marginTop: 16 }} onClick={e => { e.preventDefault(); goHome("cond") }}>내 조건 입력하고 시작하기</button></section>
      <section className="hsec hs-menu" aria-labelledby="menu-t"><h2 id="menu-t">무엇을 할 수 있나요</h2><p className="hint">필요한 메뉴를 누르면 바로 이동합니다.</p><div className="scw" aria-hidden="true"><img className="sc sc-p" src={CHP} alt="" /></div><div className="mgrid">{HOME_MENU.map(m => <button key={m[0]} className="mitem" onClick={e => { e.preventDefault(); goHome(m[0]) }}><span className="ico">{svg(m[0])}</span><span><b>{m[1]}</b><span>{m[2]}</span></span></button>)}</div></section>
      <section className="hsec" aria-labelledby="now-t"><div className="hhead"><h2 id="now-t">{op.length ? "지금 확인할 정책" : "최근 등록된 정책"}</h2><button className="more" data-sortgo="" onClick={e => onSortGo(e, "")}>전체 정책 모아보기 ›</button></div><p className="hint">{op.length ? "모집 중이거나 곧 접수가 시작되는 정책입니다." : "현재 모집 중인 정책이 없어 최근 등록 순으로 보여드립니다."}</p><div className="nowlist">{pick.map(x => { const d = x.p.applicationEnd && x.st != "마감" ? dday(x.p) : null; return <button key={x.p.id} className="nowc" onClick={() => openPolicy(x.p.id)}><span><span className={`badge ${x.st == "마감 임박" ? "dd" : x.st == "모집 중" ? "ok" : "gr"}`}>{x.st + (d != null && x.st != "접수 예정" ? (d == 0 ? " D-day" : " D-" + d) : "")}</span></span><b>{x.p.title}</b><span className="meta">{x.p.organization}</span></button> })}</div></section>
      <section className="goal" aria-labelledby="goal-t"><div className="eyebrow" id="goal-t">밭모영의 목표</div><p className="lead">제주 청년농이 받을 수 있는 지원을 놓치지 않도록,<br />흩어진 공고를 한 밭에 모아 내 조건에 맞는 것부터 보여드립니다.</p>
        <div className="pillars">{HOME_PILLARS.map(x => <div className="pillar" key={x[0]}><b>{x[0]}</b><span>{x[1]}</span></div>)}</div></section>
    </>
  }

  function renderCal() {
    const first = new Date(calY, calM, 1).getDay(), days = new Date(calY, calM + 1, 0).getDate(), pre = calY + "-" + pad2(calM + 1), ev = {}, sv = {};
    P.forEach(p => { if (p.applicationEnd && p.applicationEnd.startsWith(pre)) (ev[p.applicationEnd] = ev[p.applicationEnd] || []).push(p); if (p.applicationStart && p.applicationStart.startsWith(pre)) (sv[p.applicationStart] = sv[p.applicationStart] || []).push(p) });
    const sel = calSel && calSel.startsWith(pre) ? calSel : null;
    if (sel !== calSel) setCalSel(sel);
    const ts = ymd(TODAY);
    const row = (k, p, t, key) => <div className="alr" key={key}><span className={`badge ${t == "마감" ? "dd" : "ok"}`}>{`${k.slice(5).replace("-", "/")} ${t}`}</span><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button></div>;
    const calPop = (k, col, s2, e) => <div className={`calpop ${col < 2 ? "al" : col > 4 ? "ar" : ""}`} role="dialog" aria-label={`${+k.slice(5, 7)}월 ${+k.slice(8)}일 일정`}><div className="cph"><b>{`${+k.slice(5, 7)}월 ${+k.slice(8)}일 일정`}</b><button className="cpx" aria-label="닫기" ref={cpxRef} onClick={calClose}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>{(s2 || []).map(p => row(k, p, "접수 시작", "s" + p.id))}{(e || []).map(p => row(k, p, "마감", "e" + p.id))}</div>;
    const cells = ["일", "월", "화", "수", "목", "금", "토"].map(d => <div className="dow" aria-hidden="true" key={"w" + d}>{d}</div>);
    for (let i = 0; i < first; i++)cells.push(<div key={"b" + i}></div>);
    for (let d = 1; d <= days; d++) {
      const k = pre + "-" + pad2(d), e = ev[k], s2 = sv[k], lab = `${calM + 1}월 ${d}일${e ? " 마감 " + e.length + "건" : ""}${s2 ? " 접수 시작 " + s2.length + "건" : ""}`;
      const inner = <><span className="dn">{d}</span>{(s2 || []).map(p => <span className="cnt s" key={"s" + p.id}>{ccat(p)}</span>)}{(e || []).map(p => <span className="cnt" key={"e" + p.id}>{ccat(p)}</span>)}</>;
      const col = (first + d - 1) % 7;
      cells.push(e || s2 ? <div className="dcell" style={{ "--c": col }} key={k}><button className={`day${k == ts ? " today" : ""}`} data-calday={k} aria-pressed={sel == k} aria-expanded={sel == k} aria-haspopup="dialog" aria-label={lab} ref={el => { dayRefs.current[k] = el }} onClick={() => calDay(k)}>{inner}</button>{sel == k ? calPop(k, col, s2, e) : null}</div>
        : <div className={`day${k == ts ? " today" : ""}`} aria-label={lab} key={k}>{inner}</div>);
    }
    const keys = [...new Set([...Object.keys(ev), ...Object.keys(sv)])].sort();
    const list = keys.flatMap(k => [...(sv[k] || []).map(p => row(k, p, "접수 시작", "s" + k + p.id)), ...(ev[k] || []).map(p => row(k, p, "마감", "e" + k + p.id))]);
    const und = P.filter(p => !p.applicationEnd);
    return <>
      <div className="top"><button className="ic" data-calnav="-1" aria-label="이전 달" onClick={() => calNav(-1)}>‹</button><h2 style={{ margin: 0 }}>{`${calY}년 ${calM + 1}월 신청 일정`}</h2><button className="ic" data-calnav="1" aria-label="다음 달" onClick={() => calNav(1)}>›</button></div>
      <div className="calleg" aria-hidden="true"><span><i className="lg s"></i>접수 시작</span><span><i className="lg"></i>마감</span></div>
      <div className="cal">{cells}</div>
      <h3 style={{ fontSize: 16, margin: "20px 0 4px" }}>이번 달 일정</h3><div className="clist">{list.length ? list : <div className="meta">이번 달 접수 시작·마감 일정 없음</div>}</div>
      <h3 style={{ fontSize: 16, margin: "20px 0 4px" }}>마감일이 정해지지 않은 정책 <span className="meta">{`${und.length}건`}</span></h3>
      <div className="clist">{(calAll ? und : und.slice(0, 6)).map(p => <div className="alr" key={p.id}><span className="badge chk">확인 필요</span><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button></div>)}</div>
      {und.length > 6 ? <button className="ic calmore" aria-expanded={calAll} onClick={() => setCalAll(a => !a)}>{calAll ? "접기" : `${und.length}건 모두 보기`}</button> : null}
      <div className="note">날짜를 누르면 그날 일정을 볼 수 있습니다. 공개된 공고 기준이며, 실제 일정은 공식 공고문에서 확인하시기 바랍니다.</div>
    </>
  }

  function renderSide() {
    if (view == "fav") {
      const FL = P.filter(p => fav.includes(p.id));
      return <><h2 style={{ margin: "0 0 8px" }}>관심 정책 <span className="meta">{`${FL.length}건`}</span></h2>
        {FL.length ? FL.map(p => <div className="alr" style={{ justifyContent: "space-between" }} key={p.id}><div><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button><div className="meta">{rowMeta(p)}</div></div><button className="ic" aria-pressed="true" aria-label="관심 정책 해제" onClick={() => toggleFav(p.id)}>★ 해제</button></div>)
          : <div className="empty">관심 정책 없음<br />정책 카드의 ☆ 관심을 누르면 이곳에 모입니다.</div>}</>
    }
    const ids = Object.keys(REC).filter(id => P.some(p => p.id == id));
    return <><h2 style={{ margin: "0 0 8px" }}>신청 기록 <span className="meta">{`${ids.length}건`}</span></h2>
      {ids.length ? RS.map(s => {
        const RL = ids.filter(id => REC[id] == s).map(id => P.find(p => p.id == id)); return RL.length ? <Fragment key={s}><h3 style={{ fontSize: 16, margin: "16px 0 4px" }}>{`${s} `}<span className="meta">{`${RL.length}건`}</span></h3>
          {RL.map(p => <div className="rvi" key={p.id}><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button><div className="meta">{rowMeta(p)}</div><div className="chips" role="group" aria-label="진행 상태">{RS.map(x => <button key={x} className="chip" aria-pressed={REC[p.id] == x} onClick={() => toggleRec(p.id, x)}>{x}</button>)}<button className="ic" onClick={() => toggleRec(p.id, s)}>기록 삭제</button></div></div>)}</Fragment> : null
      }) : <div className="empty">신청 기록 없음<br />정책 상세의 '신청 기록'에서 진행 상태를 선택하십시오.</div>}</>
  }

  const hidden = { display: "none" }, shown = { display: "" };
  const m = megaKey && MEGA[megaKey];

  return <>
    <nav ref={navRef} onMouseLeave={() => hideMega()} onMouseEnter={() => clearTimeout(megaT.current)}><div className="w">
      <a className={`brand${view == "home" ? " on" : ""}`} href="#" id="navhome" aria-current={view == "home" ? "page" : undefined} aria-label="밭모영 홈" onClick={e => { e.preventDefault(); goView("home") }} onMouseEnter={() => hideMega(true)} onFocus={() => hideMega(true)}><img className="brandlogo" src={brandLogo} alt="밭모영" width="100" height="36" /></a>
      {NAV.map(([id, k, label]) => <a key={id} href={id == "navcond" ? "#top-panel" : "#"} id={id} className={NAV_VIEW[id] == view ? "on" : undefined} aria-current={NAV_VIEW[id] == view ? "page" : undefined} aria-haspopup="true" aria-expanded={megaKey == k} ref={el => { navLinks.current[k] = el }}
        onClick={e => onNavClick(e, id)} onMouseEnter={() => { if (canHover) showMega(k) }} onFocus={() => { if (canHover) showMega(k) }}>{label}</a>)}
      <div className="stats" aria-label="정책 현황">
        <button type="button" data-sortgo="new" title="정책 모아보기 (최신 등록순)" onClick={e => onSortGo(e, "new")}><strong id="s1">{allSt.filter(x => x == "모집 중" || x == "마감 임박").length}</strong>모집 중</button>
        <button type="button" data-sortgo="due" title="정책 모아보기 (마감 임박순)" onClick={e => onSortGo(e, "due")}><strong id="s2">{allSt.filter(x => x == "마감 임박").length}</strong>마감 임박(7일 이내)</button>
        <button type="button" title="관심 정책으로 이동" onClick={e => { e.preventDefault(); goHome("fav") }}><strong id="s3">{fav.length}</strong>관심 정책</button>
      </div></div>
      <div className="mega" id="mega" hidden={!m}>{m ? <div className="w"><button className="intro" aria-label={`${m[0]} 바로 가기`} onClick={e => onMegaGo(e, megaKey)}><span className="ico">{svg(megaKey, 32)}</span><h3>{m[0]}</h3><p>{m[1]}</p><span className="go">바로 가기 →</span></button><div className="sub">{m[2].map((x, i) => <div className="si" key={i}><b>{x[1]}</b><span>{x[2]}</span></div>)}</div></div> : null}</div>
    </nav>
    <header className="hero"><div className="w"><img className="herochar" src={heroCharacter} alt="밀짚모자를 쓰고 손을 흔드는 밭모영 캐릭터" width="180" /><h1>제주 청년농 지원사업,<br />내 상황에 맞는 것만 <span className="tang">딱!</span></h1>
      <button className="btn herocta" id="herocta" onClick={onHeroCta}>나에게 맞는 정책 모아보기<span className="arr" aria-hidden="true">→</span></button>
    </div></header>
    <main className="w">
      <div id="homeview" className="home" style={view == "home" ? shown : hidden}>{renderHome()}</div>
      <section className="panel" id="searchbox" role="search" aria-label="정책 검색" style={main ? shown : hidden}><div className="search"><div className="qwrap">
        <input id="q" ref={qRef} type="search" placeholder="정책명, 기관, 키워드 검색 (예: 농기계, 땅, 교육)" aria-label="정책 검색" role="combobox" aria-autocomplete="list" aria-expanded={acOpen} aria-controls="ac" aria-activedescendant={acOpen && ac.i >= 0 ? "ac-" + ac.i : undefined} autoComplete="off"
          value={qInput} onChange={onQChange} onKeyDown={onQKeyDown} onBlur={() => { setTimeout(acClose, 120) }} />
        <ul id="ac" className="ac" role="listbox" aria-label="추천 검색어" hidden={!acOpen} onMouseDown={e => e.preventDefault()}>{ac.items.map((o, i) => <li key={i} id={`ac-${i}`} role="option" aria-selected={i == ac.i} onClick={() => acPick(i)}><span className="k">{o.kind}</span><span className="t">{acMark(o.v, ac.mv)}</span></li>)}</ul>
      </div><button className="btn" id="goto" onClick={e => { e.preventDefault(); doSearch() }}>맞춤 정책 찾기</button></div>
        <p id="qinfo" className="qinfo" hidden={!Q}>{Q ? <><b>{`'${Q}'`}</b>{` 검색 결과${syn.length ? ` · 함께 찾은 말: ${syn.slice(0, 6).join(", ")}` : ""} `}<button className="ic qclear" onClick={clearQuery}>검색어 지우기</button></> : null}</p></section>
      <section className="panel" id="top-panel" ref={topPanelRef} style={main ? shown : hidden}><div className="phead"><h2>내 조건</h2><p className="hint">나이·지역·경력·경영체 등록 여부를 입력하면 기본 조건이 맞는 정책을 먼저 보여드립니다. 조건은 이 기기에만 저장됩니다.</p></div>
        <div className="frow"><span className="flab" id="cats-l">카테고리</span><div className="chips" id="cats" role="group" aria-labelledby="cats-l" ref={catsRef}>{CATS.map(x => <button key={x} className="chip" aria-pressed={S.cats.includes(x)} onClick={() => toggleChip("cats", x)}>{x}</button>)}</div></div>
        <div className="frow"><span className="flab" id="sts-l">모집 상태</span><div className="chips" id="sts" role="group" aria-labelledby="sts-l" ref={stsRef}>{STS.map(x => <button key={x} className="chip" aria-pressed={S.sts.includes(x)} onClick={() => toggleChip("sts", x)}>{x}</button>)}</div></div>
        <div className="row"><div><label htmlFor="age">만 나이</label><input id="age" ref={ageRef} type="number" min="0" max="120" placeholder="예: 32" value={S.age} onChange={e => onCondChange("age", e)} /></div>
          <div><label htmlFor="reg">영농 지역</label><select id="reg" value={S.region} onChange={e => onCondChange("region", e)}><option value="">선택 안 함</option><option>제주시</option><option>서귀포시</option></select></div>
          <div><label htmlFor="exp">영농경력</label><select id="exp" value={S.exp} onChange={e => onCondChange("exp", e)}><option value="">선택 안 함</option><option value="0">영농 준비 중</option><option value="1">1년 미만</option><option value="2">1~2년</option><option value="3">3~5년</option><option value="4">5년 초과</option></select></div>
          <div><label htmlFor="biz">농업경영체 등록</label><select id="biz" value={S.biz} onChange={e => onCondChange("biz", e)}><option value="">선택 안 함</option><option value="1">등록함</option><option value="0">등록 안 함</option></select></div></div>
        <div className="chips" id="tags" aria-live="polite">{tags.length ? <button className="ic" id="reset" onClick={resetAll}>전체 초기화</button> : null}{tags.map(t => <button key={t[0]} className="tag" aria-label={`${t[1]} 필터 해제`} onClick={() => removeTag(t[0])}>{`${t[1]} ✕`}</button>)}</div></section>
      <section className="panel" id="calview" style={view == "cal" ? shown : hidden} aria-label="신청 달력">{view == "cal" ? renderCal() : null}</section>
      <section className="panel" id="sideview" style={view == "fav" || view == "rec" ? shown : hidden} aria-live="polite">{view == "fav" || view == "rec" ? renderSide() : null}</section>
      <div className="bar" ref={barRef} style={main ? shown : hidden}><strong id="cnt">{`검색 결과 ${L.length}건`}</strong><div><label className="sl">정렬 <select id="sort" value={sort} onChange={e => { setSort(e.target.value); setPg(1); bump() }}><option value="fit">나에게 맞는 정책순</option><option value="due">마감 임박순</option><option value="new">최신 등록순</option></select></label>
        <label className="ck"><input type="checkbox" id="hide" checked={hide} onChange={e => { setHide(e.target.checked); setPg(1); bump() }} /> 조건 불일치 숨기기</label><label className="ck"><input type="checkbox" id="hideend" checked={hideend} onChange={e => { setHideend(e.target.checked); setPg(1); bump() }} /> 마감 정책 숨기기</label></div></div>
      <div id="list" ref={listRef} style={main ? shown : hidden}>{L.length ? L.slice((page - 1) * PER, page * PER).map(card) : <div className="empty"><b>조건에 맞는 정책 없음</b><br />{`${Q ? `'${Q}' 대신 더 짧거나 일반적인 말(예: 농지, 자금, 교육)로 검색하거나 ` : ""}필터를 줄이거나 '조건 불일치 숨기기'·'마감 정책 숨기기'를 해제하십시오.`}</div>}</div>
      <div className="pager" id="pager" role="navigation" aria-label="정책 목록 페이지" hidden={tp <= 1} style={main ? shown : hidden}>{renderPager()}</div>
      <section className="panel" id="srcs" ref={srcsRef} style={main ? shown : hidden}><h2>공식 공고 바로가기</h2><p className="hint">도청, 시청, 농업기술센터, 농어촌공사 공고를 한곳에서 확인하시기 바랍니다. 새 공고는 아래 공식 사이트에 먼저 올라오고, 이 페이지의 정보와 다르면 공식 사이트가 기준입니다.</p><div className="chips">{SOURCES.map(([href, label]) => <a key={href} className="chip" style={{ textDecoration: "none", color: "inherit" }} href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}</div></section>
      <footer>⚠ 정책 정보는 공개된 공고·보도자료를 바탕으로 정리한 것이며 확인일은 카드에 표시됩니다. 신청 기간과 자격은 바뀔 수 있습니다. 조건 비교는 참고용이며 공식 자격 심사가 아닙니다. 최종 신청 자격은 반드시 공식 공고문에서 확인하시기 바랍니다.</footer></main>
    <footer className="sitefoot" aria-label="사이트 정보"><div className="w">
      <img className="flogo" src={footerLogo} alt="혼디모영" width="40" /><div className="finfo"><p className="fname"><strong>혼디모영</strong> (hondi-moyeong)</p><p className="fmail"><strong>이메일</strong> moyeonghondi@gmail.com</p>
        <p className="fcopy">© 2026 hondi-moyeong. All rights reserved.</p></div>
      <a className="insta" href="https://www.instagram.com/moyeonghondi?exln=a3o0bDJrYnJ2eHVt" target="_blank" rel="noopener" aria-label="혼디모영 인스타그램 (새 창)"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg></a>
    </div></footer>
  </>
}
