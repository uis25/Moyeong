// 원본(original/original/index.html)과 React 앱을 같은 조작으로 비교하는 스크립트
// 사용법: npm run compare            → 전체 시나리오
//         npm run compare -- mobile  → 한 묶음만 (desktop, desktop-full, dark, tablet, mobile, mobile-full)
// 단계마다 스크린샷 픽셀 · 보이는 모든 요소의 계산된 스타일 · 화면 텍스트 · 스크롤 위치 · localStorage 를 비교하고,
// 다른 단계가 있으면 compare-results/ 에 원본/React/차이 이미지를 저장합니다.
import { chromium } from "playwright";
import { createServer, loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { PAGE_HEADINGS, PAGE_GUIDES } from "../src/constants/navigation.js";
import { rowToPolicy } from "../src/services/policyMapping.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "compare-results");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

// 비교용 Vite 개발 서버를 직접 띄움 (원본 HTML도 같은 서버에서 제공)
const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const BASE = server.resolvedUrls.local[0].replace(/\/$/, "");
const URLS = { orig: BASE + "/original/original/index.html", react: BASE + "/" };
const settle = (p, ms = 900) => p.waitForTimeout(ms);
// 원본에서 의도적으로 바꾼 부분(docs/differences.md)은 원본 쪽에 같은 변경을 CSS로 적용한 뒤 비교
const ORIGINAL_OVERRIDES = [
  ".upcoming{background:var(--g2);color:var(--g);opacity:.45}", // 접수 예정 배지 (흐린 초록)
  ".ex{overflow-wrap:anywhere}", // 자세히 보기: 띄어쓰기 없는 긴 글자도 줄바꿈 (차이 27번)
  // 글꼴 출처 차이(차이 3번): Google Fonts와 npm 패키지의 글꼴 파일이 ◉ 기호를 몇 픽셀 다르게 그림 → 원본 쪽 ◉도 React와 같은 파일로
  // (같은 글꼴 이름·범위가 겹치면 나중에 정의한 @font-face가 먼저 쓰임)
  ...[400, 500, 700, 800].map(w => `@font-face{font-family:"Noto Sans KR";font-weight:${w};font-style:normal;unicode-range:U+25C9;src:url(/node_modules/@fontsource/noto-sans-kr/files/noto-sans-kr-96-${w}-normal.woff2) format("woff2")}`),
  // 요청으로 바꾼 디자인(화면별 제목·이용 가이드, 선택 상자, 모바일 메뉴 등)은 React의 해당 CSS 파일을 원본 쪽에도 그대로 적용
  // (원본과 CSS 변수 이름이 달라 React 토큰 파일도 함께 넣음. 변수 정의만 있어 원본의 다른 부분에는 영향 없음)
  ...["styles/tokens.css", "features/navigation/MobileMenu.css", "features/navigation/Hero.css", "features/navigation/PageGuide.css", "components/Select.css", "features/policies/ConditionsPanel.css", "features/policies/ResultBar.css"]
    .map(f => fs.readFileSync(path.join(ROOT, "src", f), "utf8")),
].join("\n");
// 원본이 카드 HTML을 만드는 card() 함수를 감싸서 같은 변경을 적용 (요소 자체를 빼서 React와 같은 DOM으로 만듦)
// 정책 데이터는 원본 이후 갱신될 수 있으므로, 원본 쪽 데이터(P)도 현재 policies.json으로 맞춘 뒤 비교 (코드 동작만 비교)
// 원본은 글자를 HTML로 그대로 끼워 넣어 원문의 "<P. 26>" 같은 표기가 태그로 읽혀 사라짐 → 원본 쪽 데이터만 < > 를 기호로 바꿔 비교 (React는 원래 기호 그대로 표시)
const escTags = v => typeof v == "string" ? v.replace(/</g, "&lt;").replace(/>/g, "&gt;") : Array.isArray(v) ? v.map(escTags) : v;
// 정책 데이터는 React 앱과 같은 곳(Supabase policies 테이블)에서 읽음
const env = loadEnv("development", ROOT, "VITE_");
const { data: policyRows, error: policyError } = await createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  .from("policies").select("*").order("sort_order");
if (policyError) throw policyError;
const POLICIES = policyRows.map(rowToPolicy)
  .map(p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, ["description", "details", "eligibilityDetails", "requiredDocuments"].includes(k) ? escTags(v) : v])));
const ORIGINAL_SCRIPT = ({ policies, headings, guides }) => {
  P.splice(0, P.length, ...policies); // 원본 스크립트의 최상위 const P (배열 내용만 교체)
  STS.splice(STS.indexOf("확인 필요"), 1); // 모집 상태 필터 칩에서 "확인 필요" 제거
  const card = window.card;
  window.card = x => card(x)
    // 정책 카드: 자격 판정 배지(첫 번째 배지) 제거
    .replace(/(<div class="top"><div>)<span class="badge [^"]*">[^<]*<\/span>/, "$1")
    // 모집 상태 배지 색: 모집 중 초록 · 마감 임박 주황(그대로) · 접수 예정 흐린 초록 · 확인 필요 노랑 · 마감 회색
    .replace(/(<div class="top"><div>)<span class="badge [^"]*">(([^ <]+(?: [^ <]+)?) [^<]*)<\/span>/, (m, head, text, st) =>
      `${head}<span class="badge ${{ "모집 중": "ok", "마감 임박": "dd", "접수 예정": "upcoming", "확인 필요": "chk", "마감": "gr" }[st] || "gr"}">${text}</span>`)
    // 공식 링크가 없으면 "공식 링크 없음" 대신 흐린 "공식 공고문 ↗" 버튼
    .replace('<span class="btn s" aria-disabled="true" style="opacity:.45;cursor:default">공식 링크 없음</span>', '<a class="btn s" aria-disabled="true" style="opacity:.45;pointer-events:none">공식 공고문 ↗</a>')
    // 신청 기간: 날짜가 빠진 쪽은 "?" 대신 있는 정보만 문장으로 (차이 23번)
    .replace(/<br>신청 \S+ ~ \S+ · /, () => { const s = x.p.applicationStart, e = x.p.applicationEnd; return "<br>신청 " + (s && e ? `${s} ~ ${e}` : e ? `~ ${e} 마감` : s ? `${s}부터 · 마감일 공고 확인` : "기간 공고문 확인") + " · " })
    // 내 조건과 비교: 나이 조건 원문(ageText)이 있으면 숫자 범위 대신 원문 그대로
    .replace(/(<div class="note">정책 기준: 연령 )[^·]*?( · 영농경력)/, (m, a, b) => x.p.ageText ? a + x.p.ageText + b : m)
    // 자세히 보기: 요약이 비면 안내 문구 (차이 13번)
    .replace(/<div class="ex"><p style="margin:0">[\s\S]*?<\/p>/, () => '<div class="ex">' + (x.p.description ? `<p style="margin:0">${hl(x.p.description)}</p>` : '<p class="meta" style="margin:0">확인된 요약 없음. 공식 공고를 확인하십시오.</p>'))
    // 자세히 보기: "신청 대상 및 자격" 칸을 빼고 "내 조건과 비교"만 전체 폭으로 (차이 26번)
    .replace(/<div class="ex2"><div class="exc"><h4>신청 대상 및 자격<\/h4>[\s\S]*?<\/div><div class="exc">(<h4>내 조건과 비교[\s\S]*?<div class="note">정책 기준:[^<]*<\/div>)<\/div><\/div>/, "$1");
  // 목록 정렬: 모집 상태 순서(마감 임박·모집 중 → 접수 예정 → 확인 필요 → 마감) 추가.
  // 원본 render() 안의 정렬 부분만 바꿔 같은 이름으로 다시 정의 (render를 부르는 다른 함수들도 새 render를 씀)
  const SORT_OLD = 'L.sort((a,b)=>{const c=(a.st=="마감")-(b.st=="마감");if(c)return c;if(so=="due"){if(a.st=="마감")return end(b.p)-end(a.p);return end(a.p)-end(b.p)}if(so=="new")return(b.p.reg||"").localeCompare(a.p.reg||"");return rank[a.e.overall]-rank[b.e.overall]||(QX.length?b.qs-a.qs:0)||b.e.score-a.e.score});';
  const SORT_NEW = 'const O={"마감 임박":0,"모집 중":0,"접수 예정":1,"확인 필요":2,"마감":3};L.sort((a,b)=>{const c=(a.st=="마감")-(b.st=="마감");if(c)return c;const s=O[a.st]-O[b.st];if(so=="due"){if(s)return s;if(a.st=="마감")return end(b.p)-end(a.p);return end(a.p)-end(b.p)}if(so=="new")return s||(b.p.reg||"").localeCompare(a.p.reg||"");return rank[a.e.overall]-rank[b.e.overall]||(QX.length?b.qs-a.qs:0)||s||b.e.score-a.e.score});';
  // 원본 함수의 일부 코드만 바꿔 같은 이름으로 다시 정의 (그 함수를 부르는 다른 코드도 새 함수를 씀)
  const redefine = (name, from, to) => {
    const src = window[name].toString();
    if (!src.includes(from)) throw new Error(`원본 ${name}()에서 바꿀 코드를 찾지 못함`);
    (0, eval)(`${name} = ` + src.replace(from, to));
  };
  redefine("render", SORT_OLD, SORT_NEW);
  // 홈 '지금 확인할 정책' 배지 색을 카드와 같은 규칙으로
  redefine("renderHome", '${x.st=="마감 임박"?"dd":x.st=="모집 중"?"ok":"gr"}', '${({"모집 중":"ok","마감 임박":"dd","접수 예정":"upcoming","확인 필요":"chk","마감":"gr"})[x.st]}');
  // 후기 작성 폼 아래 저장 안내 문구, 신청 기록 아래 안내 문구 제거
  redefine("rvSection", "<div class=\"note\">${RVMODE==\"shared\"?\"후기는 이 페이지를 여는 사람들과 공유됩니다. 작성자 이름은 표시되지 않습니다. 같은 계정으로 다시 등록하면 기존 후기가 수정됩니다.\":\"공유 저장소에 연결되지 않아 후기는 이 기기(localStorage)에만 저장되고, 다른 사람에게는 보이지 않습니다. 같은 기기에서 다시 등록하면 기존 후기가 수정됩니다.\"}</div>", "");
  redefine("recBlock", '<div class="note">직접 고르는 진행 상태 (다시 누르면 기록 삭제, 이 기기에만 저장)</div>', "");
  // "이 기기에만 저장" 안내 문구 삭제: 내 조건 칸 설명, 홈 '이렇게 이용하세요' 1단계 (차이 20번)
  document.querySelector("#top-panel .phead .hint").remove();
  // 전체 초기화 버튼은 "내 조건" 제목 줄 오른쪽에 고정(조건이 없으면 자리만 남기고 숨김), 선택한 조건 태그 줄은 없앰 (차이 22번)
  {
    const r = document.createElement("button"); r.className = "ic"; r.id = "reset"; r.textContent = "전체 초기화";
    document.querySelector("#top-panel .phead").append(r); document.getElementById("tags").remove();
    redefine("render", '$("tags").innerHTML=(tg.length?`<button class="ic" id="reset">전체 초기화</button>`:"")+tg.map(t=>`<button class="tag" data-rm="${t[0]}" aria-label="${t[1]} 필터 해제">${t[1]} ✕</button>`).join("");',
      '$("reset").className=tg.length?"ic":"ic off";tg.length?$("reset").removeAttribute("aria-hidden"):$("reset").setAttribute("aria-hidden","true");');
  }
  redefine("renderHome", "<span>만 나이·영농 지역·영농경력·농업경영체 등록 여부 입력 (이 기기에만 저장)</span>", "<span>만 나이·영농 지역·영농경력·농업경영체 등록 여부 입력</span>");
  // 메뉴 안내판 없앰: 마우스를 올려도 열지 않고, 메뉴 링크의 팝업 속성도 뺌 (차이 24번)
  (0, eval)("showMega = function () {}");
  document.querySelectorAll("nav a[aria-haspopup]").forEach(a => { a.removeAttribute("aria-haspopup"); a.removeAttribute("aria-expanded") });
  // 화면별 이용 가이드: React의 PageGuide와 같은 구조를 main 맨 앞에 그림. 닫은 화면은 localStorage(bmy_guide)에 저장 (차이 24번)
  {
    const main = document.querySelector("main.w"), box = document.createElement("div");
    box.style.display = "contents"; main.prepend(box);
    const esc = t => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const rich = parts => parts.map(x => typeof x == "string" ? esc(x) : `<b${x[1] ? ` class="g${x[1]}"` : ""}>${esc(x[0])}</b>`).join("");
    const load = () => { try { const v = JSON.parse(localStorage.getItem("bmy_guide")); return Array.isArray(v) ? v : [] } catch (e) { return [] } };
    let cur = "home";
    window.__guide = (v, focus) => {
      cur = v; const g = guides[v], closed = load().includes(v);
      box.innerHTML = !g ? "" : closed ? '<div class="guideopen"><button type="button" class="lnk">이용 가이드 다시 보기</button></div>'
        : `<section class="guide" aria-labelledby="guide-h"><div class="ghead"><h2 id="guide-h">${esc(g.title)}</h2><button type="button" class="gclose">가이드 닫기<span aria-hidden="true">✕</span></button></div>`
          + (g.flow ? `<ol class="gflow">${g.flow.map(x => `<li><span>${esc(x)}</span></li>`).join("")}</ol><p class="gtext">${rich(g.text)}</p>`
            : `<ol class="gsteps">${g.steps.map(([t, d], i) => `<li><span class="gnum" aria-hidden="true">${i + 1}</span><div><b>${esc(t)}</b><p>${rich(d)}</p></div></li>`).join("")}</ol>`) + "</section>";
      if (focus) box.querySelector("button")?.focus();
    };
    box.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      const close = b.classList.contains("gclose"), list = load().filter(x => x != cur);
      localStorage.setItem("bmy_guide", JSON.stringify(close ? [...list, cur] : list));
      window.__guide(cur, true);
    });
  }
  // 상단 제목: 홈 외 화면은 메뉴 이름 + 설명 한 줄 (차이 18번)
  const h1 = document.querySelector(".hero h1"), homeH1 = h1.innerHTML, sub = document.createElement("p");
  sub.className = "herosub";
  window.__hero = v => {
    const m = v != "home" && headings[v];
    if (m) { h1.className = "pageh"; h1.textContent = m[0]; sub.textContent = m[1]; h1.after(sub) }
    else { h1.removeAttribute("class"); h1.innerHTML = homeH1; sub.remove() }
  };
  // 선택 상자: 원본 <select>는 숨기고 React와 같은 모양의 선택 목록을 만들어, 고르면 원본 select 값을 바꾸고 원본이 듣는 input 이벤트를 보냄 (차이 19번)
  const draws = [];
  for (const id of ["reg", "exp", "biz", "sort"]) {
    const s = document.getElementById(id), wrap = document.createElement("div"), btn = document.createElement("button");
    wrap.className = "sel"; wrap.dataset.sel = id;
    btn.type = "button"; btn.id = id + "-btn"; btn.className = "selbtn"; btn.setAttribute("aria-haspopup", "listbox");
    wrap.append(btn);
    let open = false, active = 0;
    const opts = () => [...s.options].map(o => [o.value, o.textContent]);
    const idx = () => Math.max(0, opts().findIndex(([v]) => v === s.value));
    const draw = () => {
      btn.textContent = opts()[idx()][1]; btn.setAttribute("aria-expanded", String(open));
      wrap.querySelector("ul")?.remove();
      if (!open) return;
      const ul = document.createElement("ul"); ul.className = "sellist"; ul.setAttribute("role", "listbox");
      opts().forEach(([v, t], i) => {
        const li = document.createElement("li"); li.setAttribute("role", "option"); li.dataset.value = v; li.setAttribute("aria-selected", String(i === idx()));
        if (i === active) li.className = "on";
        li.textContent = t;
        // 마우스를 올리면 강조 표시만 옮김 (목록을 새로 만들면 누른 항목과 뗀 항목이 달라져 클릭이 사라짐)
        li.addEventListener("pointerenter", () => { active = i; [...ul.children].forEach((x, j) => j === i ? x.className = "on" : x.removeAttribute("class")) });
        li.addEventListener("mousedown", e => e.preventDefault()); li.addEventListener("click", () => pick(i));
        ul.append(li);
      });
      wrap.append(ul);
    };
    const pick = i => { open = false; const v = opts()[i][0]; if (v !== s.value) { s.value = v; s.dispatchEvent(new Event("input", { bubbles: true })); s.dispatchEvent(new Event("change", { bubbles: true })) } draw() };
    btn.addEventListener("click", () => { if (open) open = false; else { active = idx(); open = true } draw() });
    document.addEventListener("pointerdown", e => { if (open && !wrap.contains(e.target)) { open = false; draw() } });
    s.style.display = "none";
    const lab = s.closest("label.sl");
    if (lab) { // 정렬: <label class="sl">정렬 <select></label> → <div class="sl"><span>정렬</span>…</div>
      const div = document.createElement("div"), span = document.createElement("span");
      div.className = "sl"; span.textContent = "정렬"; div.append(span, s, wrap); lab.replaceWith(div);
    } else s.after(wrap);
    draws.push(draw);
  }
  // 원본 render()가 저장된 조건으로 select 값을 되돌리므로, 그릴 때마다 선택 목록 글자도 맞춤
  window.__selSync = () => draws.forEach(d => d());
  (0, eval)('{ const r = render; render = function () { const x = r.apply(this, arguments); window.__selSync(); return x } }');
  // 모바일 메뉴: ☰ 버튼 · 어두운 배경 · 메뉴 링크를 감싸는 서랍을 React와 같은 구조로 만들고 같은 동작을 붙임 (차이 21번)
  {
    const w = document.querySelector("nav .w"), brand = document.getElementById("navhome");
    const ico = d => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`;
    const btn = document.createElement("button"), dim = document.createElement("div"), menu = document.createElement("div");
    btn.type = "button"; btn.className = "navbtn"; btn.setAttribute("aria-controls", "navmenu");
    dim.setAttribute("aria-hidden", "true"); menu.id = "navmenu";
    const stats = w.querySelector(".stats");
    menu.append(...[...w.children].filter(x => x !== brand && x !== stats));
    w.append(btn, dim, menu, stats); // 정책 현황 숫자는 서랍 밖 (로고 옆)
    // "마감 임박(7일 이내)" → <span>마감 임박<span class="nsub">(7일 이내)</span></span> (모바일에서 괄호 부분만 숨김)
    { const t = [...document.querySelector("#s2").parentNode.childNodes].find(n => n.nodeType == 3 && n.textContent == "마감 임박(7일 이내)"); const w = document.createElement("span"), sp = document.createElement("span"); sp.className = "nsub"; sp.textContent = "(7일 이내)"; w.append("마감 임박", sp); t.replaceWith(w) }
    let open = false;
    const set = v => {
      open = v;
      btn.setAttribute("aria-expanded", String(v)); btn.setAttribute("aria-label", v ? "메뉴 닫기" : "메뉴 열기");
      btn.innerHTML = ico(v ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16");
      dim.className = "navdim" + (v ? " open" : ""); menu.className = "navmenu" + (v ? " open" : "");
      document.documentElement.classList.toggle("navlock", v);
    };
    set(false);
    btn.addEventListener("click", () => set(!open));
    dim.addEventListener("click", () => set(false));
    brand.addEventListener("click", () => set(false));
    menu.addEventListener("click", e => { if (e.target.closest("a")) set(false) }, true);
    stats.addEventListener("click", () => set(false), true);
    document.addEventListener("keydown", e => { if (e.key == "Escape" && open) { set(false); btn.focus() } });
    document.addEventListener("focusin", e => { if (open && !document.querySelector("nav").contains(e.target)) set(false) });
    matchMedia("(max-width:720px)").addEventListener("change", e => { if (!e.matches) set(false) });
  }
  // 다른 화면으로 가면 달력 날짜 팝업 닫기 + 상단 제목 바꾸기
  (0, eval)('{ const sv = setView; setView = function (v) { if (v != "cal") calSel = null; const x = sv(v); window.__hero(v); window.__guide(v); return x } }');
  window.render();
};
// 클릭 후 상세 영역 등장 애니메이션(0.2초)이 끝날 때까지 기다림 (연속 클릭 시 타이밍 차이 방지)
const tap = async (p, sel) => { await p.click(sel); await p.waitForTimeout(250) };
// 선택 상자에서 값 고르기 (상자를 눌러 목록을 연 뒤 항목 클릭)
const pick = async (p, id, v) => { await p.click(`[data-sel="${id}"] .selbtn`); await p.waitForTimeout(250); await p.click(`[data-sel="${id}"] [data-value="${v}"]`) };

const desktop = [
  ["home", async p => { }],
  ["hover-nav", async p => { await p.hover("#navpol"); await settle(p, 400) }], // 메뉴에 마우스를 올려도 안내판이 열리지 않음
  ["hero-cta", async p => { await p.click("#herocta"); await p.mouse.move(5, 890); await settle(p) }],
  ["chip-농지", async p => { await p.click("#cats >> text=농지"); await settle(p, 300) }],
  ["chip-농지-off", async p => { await p.click("#cats >> text=농지"); await settle(p, 300) }],
  ["age", async p => { await p.fill("#age", "32"); await settle(p, 300) }],
  ["open-reg", async p => { await p.click('[data-sel="reg"] .selbtn'); await settle(p, 300) }],
  ["region", async p => { await p.click('[data-sel="reg"] [data-value="제주시"]'); await settle(p, 300) }],
  ["exp", async p => { await pick(p, "exp", "1"); await settle(p, 300) }],
  ["open-card2", async p => { await p.locator(".card").nth(1).locator("text=자세히 보기").first().click(); await p.mouse.move(5, 890); await settle(p) }],
  ["scroll-card2", async p => { await p.locator(".card").nth(1).scrollIntoViewIfNeeded(); await p.evaluate(() => window.scrollBy(0, 300)); await settle(p, 300) }],
  ["doc-check", async p => { const c = p.locator(".ex input[type=checkbox]").first(); if (await c.count()) await c.click(); await settle(p, 300) }],
  ["rv-write", async p => { await tap(p, ".rv >> text=후기 쓰기"); await settle(p, 300) }],
  ["rv-star", async p => { await tap(p, ".rv .rvi >> text=4점"); await tap(p, ".rv .rvi >> text=신청이 쉬워요"); await tap(p, ".rv .rvi >> text=서류가 복잡해요"); await settle(p, 300) }],
  ["rv-submit-short", async p => { await p.fill(".rv textarea", "짧음"); await tap(p, ".rv >> text=후기 등록"); await settle(p, 300) }],
  ["rv-submit", async p => { await p.fill(".rv textarea", "신청 과정이 생각보다 간단했어요.\n추천합니다."); await tap(p, ".rv >> text=후기 등록"); await settle(p, 300) }],
  ["rv-filter", async p => { await tap(p, ".rv >> text=별점 높은순"); await tap(p, ".rv [aria-label='별점 필터'] >> text=4점"); await settle(p, 300) }],
  ["rv-edit", async p => { await tap(p, ".rv >> text=내 후기 수정"); await settle(p, 300) }],
  ["rv-edit-submit", async p => { await tap(p, ".rv .rvi >> text=5점"); await p.fill(".rv textarea", "다시 써 보니 더 좋았어요."); await tap(p, ".rv >> text=후기 등록"); await settle(p, 300) }],
  ["rv-delete", async p => { await tap(p, ".rv >> text=내 후기 삭제"); await settle(p, 300) }],
  ["rv-rewrite", async p => { await tap(p, ".rv >> text=후기 쓰기"); await tap(p, ".rv .rvi >> text=3점"); await p.fill(".rv textarea", "세 번째 후기입니다."); await tap(p, ".rv >> text=후기 등록"); await settle(p, 300) }],
  ["rec-chip", async p => { await p.click(".ex [aria-label='신청 기록'] >> text=신청 준비 중"); await settle(p, 300) }],
  ["fav", async p => { await p.locator(".card").nth(0).locator("button.ic").click(); await settle(p, 300) }],
  ["search-type", async p => { await p.click("#q"); await p.keyboard.type("농기"); await settle(p, 500) }],
  ["search-arrow", async p => { await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await settle(p, 200) }],
  ["search-enter", async p => { await p.keyboard.press("Enter"); await settle(p) }],
  ["search-clear", async p => { await p.click("text=검색어 지우기"); await settle(p, 300) }],
  ["search-땅", async p => { await p.fill("#q", "땅"); await p.click("#goto"); await settle(p) }],
  ["search-esc", async p => { await p.fill("#q", ""); await p.keyboard.type("교"); await settle(p, 500); await p.keyboard.press("ArrowUp"); await p.keyboard.press("Escape"); await settle(p, 200) }],
  ["search-click", async p => { await p.keyboard.type("육"); await settle(p, 500); await p.locator("#ac li").first().click(); await p.mouse.move(5, 890); await settle(p) }],
  ["hide-off", async p => { await p.uncheck("#hide"); await settle(p, 300) }],
  ["reset", async p => { await p.click("#reset"); await settle(p, 300) }],
  ["open-sort", async p => { await p.click('[data-sel="sort"] .selbtn'); await settle(p, 300) }],
  ["sort-due", async p => { await p.click('[data-sel="sort"] [data-value="due"]'); await settle(p, 300) }],
  ["hideend", async p => { await p.check("#hideend"); await settle(p, 300) }],
  // 쪽 번호가 생기도록 마감 정책 숨기기를 끈 뒤 이동 (정책 데이터가 바뀌어도 시나리오가 멈추지 않게, 버튼이 있을 때만 누름)
  ["hideend-off", async p => { await p.uncheck("#hideend"); await settle(p, 300) }],
  ["page2", async p => { const b = p.locator("#pager button[aria-label='2페이지']"); if (await b.count()) await b.click(); await p.mouse.move(5, 890); await settle(p) }],
  ["page-prev", async p => { const b = p.locator("#pager [aria-label='이전 페이지'][aria-disabled='false']"); if (await b.count()) await b.click(); await p.mouse.move(5, 890); await settle(p) }],
  ["nav-cal", async p => { await p.click("#navcal"); await p.mouse.move(5, 890); await settle(p) }],
  ["cal-day", async p => { await p.locator("#calview .dcell button.day").first().click(); await settle(p, 300) }],
  ["cal-esc", async p => { await p.keyboard.press("Escape"); await settle(p, 300) }],
  ["cal-day-last", async p => { await p.locator("#calview .dcell button.day").last().click(); await settle(p, 300) }],
  ["cal-close-btn", async p => { await p.click("#calview .calpop .cpx"); await settle(p, 300) }],
  ["cal-reopen", async p => { await p.locator("#calview .dcell button.day").last().click(); await settle(p, 300) }],
  ["cal-outside", async p => { await p.mouse.click(5, 600); await settle(p, 300) }],
  ["cal-prev", async p => { await p.click("[aria-label='이전 달']"); await settle(p, 300) }],
  ["cal-more", async p => { const b = p.locator(".calmore"); if (await b.count()) await b.click(); await settle(p, 300) }],
  ["cal-day2", async p => { await p.locator("#calview .dcell button.day").nth(1).click(); await settle(p, 300) }],
  ["cal-stats-click", async p => { await p.click("nav .stats >> text=모집 중"); await p.mouse.move(5, 890); await settle(p) }],
  ["back-cal", async p => { await p.click("#navcal"); await p.mouse.move(5, 890); await settle(p) }],
  ["cal-lnk", async p => { await p.locator("#calview .clist .lnk").first().click(); await p.mouse.move(5, 890); await settle(p, 1200) }],
  ["nav-fav", async p => { await p.click("#navfav"); await p.mouse.move(5, 890); await settle(p) }],
  ["nav-rec", async p => { await p.click("#navrec"); await p.mouse.move(5, 890); await settle(p) }],
  ["rec-change", async p => { await p.locator("#sideview .chip >> text=신청 완료").first().click(); await settle(p, 300) }],
  ["rec-delete", async p => { await p.locator("#sideview >> text=기록 삭제").first().click(); await settle(p, 300) }],
  ["fav-again", async p => { await p.click("#navfav"); await p.mouse.move(5, 890); await settle(p) }],
  ["fav-remove", async p => { await p.locator("#sideview >> text=★ 해제").first().click(); await settle(p, 300) }],
  ["nav-home", async p => { await p.click("#navhome"); await p.mouse.move(5, 890); await settle(p) }],
  ["home-scroll", async p => { await p.evaluate(() => window.scrollTo(0, 700)); await settle(p, 300) }],
  ["home-menu-cond", async p => { await p.click(".mitem >> text=내 조건 설정"); await p.mouse.move(5, 890); await settle(p) }],
  ["nav-home2", async p => { await p.click("#navhome"); await p.mouse.move(5, 890); await settle(p) }],
  ["home-now", async p => { await p.locator(".nowc").first().click(); await p.mouse.move(5, 890); await settle(p, 1200) }],
  ["stats-due", async p => { await p.click("nav .stats >> text=마감 임박"); await p.mouse.move(5, 890); await settle(p) }],
  ["nav-cond", async p => { await p.click("#navcond"); await p.mouse.move(5, 890); await settle(p) }],
  // 이용 가이드 닫기 → 다른 화면은 그대로 열림 → 다시 보기
  ["guide-close", async p => { await p.click("#navcal"); await p.mouse.move(5, 890); await settle(p); await p.click(".guide .gclose"); await settle(p, 300) }],
  ["guide-other", async p => { await p.click("#navrec"); await p.mouse.move(5, 890); await settle(p) }],
  ["guide-back", async p => { await p.click("#navcal"); await p.mouse.move(5, 890); await settle(p) }],
  ["guide-reopen", async p => { await p.click(".guideopen .lnk"); await settle(p, 300) }],
];
const mobile = [
  ["home", async p => { }],
  ["home-scroll", async p => { await p.evaluate(() => window.scrollTo(0, 900)); await settle(p, 300) }],
  ["menu-list", async p => { await p.click(".mitem >> text=정책 모아보기"); await settle(p) }],
  ["top", async p => { await p.evaluate(() => window.scrollTo(0, 0)); await settle(p, 300) }],
  ["chip-sts", async p => { await p.click('#sts >> text="마감"'); await settle(p, 300) }],
  ["open-card", async p => { await p.locator(".card").nth(0).locator("text=자세히 보기").first().click(); await settle(p) }],
  ["scroll-ex", async p => { await p.locator(".ex").first().scrollIntoViewIfNeeded(); await settle(p, 300) }],
  // 모바일 메뉴: ☰ 버튼으로 서랍을 연 뒤 메뉴 이동 (태블릿 너비에서는 버튼이 없어 막대에서 바로 이동)
  ["menu-open", async p => { await p.evaluate(() => window.scrollTo(0, 0)); if (await p.isVisible(".navbtn")) await p.click(".navbtn"); await settle(p, 400) }],
  ["menu-esc", async p => { if (await p.isVisible(".navbtn")) { await p.keyboard.press("Escape"); await settle(p, 400); await p.click(".navbtn"); await settle(p, 400) } }],
  ["cal", async p => { await p.click("#navcal"); await settle(p) }],
  ["menu-dim", async p => { if (await p.isVisible(".navbtn")) { await p.click(".navbtn"); await settle(p, 400); await p.mouse.click(30, 400); await settle(p, 400) } }],
  ["cal-day", async p => { await p.locator("#calview .dcell button.day").first().click(); await settle(p, 300) }],
  ["cal-day-r", async p => { await p.locator("#calview .dcell button.day").last().click(); await settle(p, 300) }],
  ["footer", async p => { await p.evaluate(() => window.scrollTo(0, 99999)); await settle(p, 300) }],
];

async function state(p) {
  return p.evaluate(() => {
    const a = document.activeElement;
    const desc = a && a !== document.body ? a.tagName + "#" + (a.id || "") + "." + (a.className || "") + ":" + (a.textContent || "").trim().slice(0, 30) : "BODY";
    // 화면에 보이는 모든 요소(+ ::before/::after)의 계산된 스타일. React의 #root 래퍼는 제외
    const els = [...document.body.querySelectorAll("*")].filter(e => e.id !== "root" && e.tagName !== "SCRIPT" && e.getClientRects().length);
    // margin은 auto일 때 Chrome이 계산 시점에 따라 다른 값을 돌려주므로 제외하고, 대신 실제 위치·크기(rect)를 비교
    const props = [...getComputedStyle(document.body)].filter(n => !n.startsWith("margin") && !n.startsWith("--")); // CSS 변수 이름 자체는 화면과 무관하므로 제외 (실제 적용된 값만 비교)
    const css = (cs) => props.map(n => n + ":" + cs.getPropertyValue(n)).join(";");
    const rect = e => { const r = e.getBoundingClientRect(); return `rect:${r.x.toFixed(2)},${r.y.toFixed(2)},${r.width.toFixed(2)},${r.height.toFixed(2)};` };
    window.__cs = els.map(e => { let t = rect(e) + css(getComputedStyle(e)); for (const ps of ["::before", "::after"]) { const c = getComputedStyle(e, ps); if (c.content != "none" && c.content != "normal") t += "|" + ps + "|" + css(c) } return t });
    const hash = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = (h * 33 + t.charCodeAt(i)) | 0; return h };
    const sigs = els.map(e => e.tagName + (typeof e.className == "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).join(".") : ""));
    return { y: Math.round(window.scrollY), focus: desc, text: document.body.innerText, view: document.body.dataset.view, sigs, hashes: window.__cs.map(hash), ls: Object.fromEntries(Object.keys(localStorage).filter(k => k != "bmy_uid").sort().map(k => [k, localStorage.getItem(k).replace(/"id":"r\d+"/g, "\"id\":\"R\"").replace(/"authorId":"u\w+"/g,"\"authorId\":\"U\"")])) };
  });
}
// 계산된 스타일 비교: 요소 순서가 다르거나 스타일이 다른 첫 요소를 찾아 다른 속성을 알려줌
async function styleDiff(pages, o, r) {
  if (o.sigs.join() != r.sigs.join()) { const i = o.sigs.findIndex((x, j) => x != r.sigs[j]); return `elements differ @${i}: ${o.sigs[i]} vs ${r.sigs[i]} (count ${o.sigs.length} vs ${r.sigs.length})` }
  const i = o.hashes.findIndex((x, j) => x != r.hashes[j]); if (i < 0) return null;
  const [a, b] = await Promise.all([pages.orig.evaluate(i => window.__cs[i], i), pages.react.evaluate(i => window.__cs[i], i)]);
  const A = a.split(";"), B = b.split(";"), d = A.map((x, j) => x != B[j] ? x + " ≠ " + B[j] : null).filter(Boolean);
  return `style differs @${i} ${o.sigs[i]} (${o.hashes.filter((x, j) => x != r.hashes[j]).length}개 요소): ${d.slice(0, 4).join(" , ")}`;
}
function diff(a, b, name) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width != B.width || A.height != B.height) return `size ${A.width}x${A.height} vs ${B.width}x${B.height}`;
  const D = new PNG({ width: A.width, height: A.height });
  const n = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0.05 });
  if (n) { fs.writeFileSync(path.join(OUT, `${name}-orig.png`), a); fs.writeFileSync(path.join(OUT, `${name}-react.png`), b); fs.writeFileSync(path.join(OUT, `${name}-diff.png`), PNG.sync.write(D)) }
  return n;
}
async function run(browser, label, steps, ctxOpts, fullPage = false) {
  const ctx = {}, pages = {};
  for (const k of ["orig", "react"]) {
    ctx[k] = await browser.newContext(ctxOpts); pages[k] = await ctx[k].newPage();
    pages[k].on("pageerror", e => console.log(`[${label}/${k}] pageerror`, e.message));
    pages[k].on("console", m => { if (m.type() == "error" || m.type() == "warning") console.log(`[${label}/${k}] console.${m.type()}`, m.text().slice(0, 200)) });
    await pages[k].goto(URLS[k], { waitUntil: "networkidle" }); await pages[k].evaluate(() => document.fonts.ready);
    if (k == "orig") { if (ORIGINAL_OVERRIDES) await pages[k].addStyleTag({ content: ORIGINAL_OVERRIDES }); await pages[k].evaluate(ORIGINAL_SCRIPT, { policies: POLICIES, headings: PAGE_HEADINGS, guides: PAGE_GUIDES }) }
    // 브라우저의 스크롤 고정(scroll anchoring)은 양쪽 모두 끄고 비교.
    // 원본은 화면을 다시 그릴 때마다 요소를 새로 만들어 이 기능이 거의 동작하지 않았고, React는 요소를 유지해 동작함 (docs/differences.md)
    await pages[k].addStyleTag({ content: "*{overflow-anchor:none!important}" });
    await settle(pages[k], 500);
  }
  let bad = 0;
  for (const [name, fn] of steps) {
    const res = {};
    for (const k of ["orig", "react"]) { await fn(pages[k]); res[k] = { shot: await pages[k].screenshot({ fullPage }), st: await state(pages[k]) } }
    const px = diff(res.orig.shot, res.react.shot, `${label}-${name}`);
    const o = res.orig.st, r = res.react.st, probs = [];
    if (px) probs.push("pixels:" + px);
    if (o.y != r.y) probs.push(`scrollY ${o.y} vs ${r.y}`);
    if (o.view != r.view) probs.push(`view ${o.view} vs ${r.view}`);
    if (o.text != r.text) probs.push("innerText differs");
    const sd = await styleDiff(pages, o, r); if (sd) probs.push(sd);
    if (JSON.stringify(o.ls) != JSON.stringify(r.ls)) probs.push("localStorage differs " + JSON.stringify(o.ls).slice(0, 300) + " || " + JSON.stringify(r.ls).slice(0, 300));
    if (o.focus != r.focus) { if (o.focus == "BODY") focusNotes.push(label + " " + name + " → " + r.focus); else probs.push(`focus [${o.focus}] vs [${r.focus}]`) }
    if (probs.length) bad++;
    console.log(`${probs.length ? "✗" : "✓"} ${label} ${name}${probs.length ? "  " + probs.join(" | ") : ""}`);
    if (o.text != r.text) { const ol = o.text.split("\n"), rl = r.text.split("\n"); for (let i = 0; i < Math.max(ol.length, rl.length); i++) if (ol[i] != rl[i]) { console.log("   text@" + i, JSON.stringify(ol[i]), "vs", JSON.stringify(rl[i])); break } }
  }
  for (const k in ctx) await ctx[k].close();
  return bad;
}
const focusNotes = [];
const browser = await chromium.launch();
// 미리 한 번 열어 둠: 코드 변경 직후 Vite가 첫 로딩 때 의존성을 최적화하며 페이지를 새로고침하는 것을 비교 전에 끝내기 위함
{ const c = await browser.newContext(), p = await c.newPage(); for (const u of Object.values(URLS)) { await p.goto(u, { waitUntil: "networkidle" }); await p.waitForTimeout(1500) } await c.close() }
const only = process.argv[2];
let bad = 0;
const suites = [
  ["desktop", desktop, { viewport: { width: 1280, height: 900 } }],
  ["desktop-full", desktop.slice(0, 1).concat([["list", async p => { await p.click("#herocta"); await settle(p) }]]), { viewport: { width: 1280, height: 900 } }, true],
  ["dark", desktop.slice(0, 12), { viewport: { width: 1280, height: 900 }, colorScheme: "dark" }],
  ["tablet", mobile, { viewport: { width: 768, height: 1024 } }],
  ["mobile", mobile, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }],
  ["mobile-full", mobile.slice(0, 1), { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, true],
];
try {
  for (const [label, steps, opts, full] of suites) {
    if (only && only != label) continue;
    let n = await run(browser, label, steps, opts, full);
    // 실패한 묶음은 한 번 더 실행: 두 번 모두 다를 때만 실제 차이로 봄 (브라우저 타이밍에 따른 일시적 차이 제외)
    if (n) { console.log(`\n↻ ${label} 다시 실행`); n = await run(browser, label, steps, opts, full) }
    bad += n;
  }
} finally {
  await browser.close();
  await server.close();
}
// 포커스는 의도적으로 원본과 다르게 함 (docs/differences.md 참고) → 실패로 치지 않고 건수만 표시
console.log("\n[의도된 차이] 포커스 유지 " + focusNotes.length + "건 (원본은 다시 그릴 때 포커스를 잃음)");
console.log(bad ? `\n✗ ${bad}단계가 다릅니다. compare-results/ 폴더의 이미지를 확인하세요.` : "\n✓ 모든 단계가 원본과 같습니다.");
process.exit(bad ? 1 : 0);
