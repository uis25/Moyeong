// 원본(original/original/index.html)과 React 앱을 같은 조작으로 비교하는 스크립트
// 사용법: npm run compare            → 전체 시나리오
//         npm run compare -- mobile  → 한 묶음만 (desktop, desktop-full, dark, tablet, mobile, mobile-full)
// 단계마다 스크린샷 픽셀 · 보이는 모든 요소의 계산된 스타일 · 화면 텍스트 · 스크롤 위치 · localStorage 를 비교하고,
// 다른 단계가 있으면 compare-results/ 에 원본/React/차이 이미지를 저장합니다.
import { chromium } from "playwright";
import { createServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "compare-results");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT);

// 비교용 Vite 개발 서버를 직접 띄움 (원본 HTML도 같은 서버에서 제공)
const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0 } });
await server.listen();
const BASE = server.resolvedUrls.local[0].replace(/\/$/, "");
const URLS = { orig: BASE + "/original/original/index.html", react: BASE + "/" };
const settle = (p, ms = 900) => p.waitForTimeout(ms);
// 클릭 후 상세 영역 등장 애니메이션(0.2초)이 끝날 때까지 기다림 (연속 클릭 시 타이밍 차이 방지)
const tap = async (p, sel) => { await p.click(sel); await p.waitForTimeout(250) };

const desktop = [
  ["home", async p => { }],
  ["hover-mega", async p => { await p.hover("#navpol"); await settle(p, 400) }],
  ["hover-mega-cal", async p => { await p.hover("#navcal"); await settle(p, 400) }],
  ["leave-mega", async p => { await p.mouse.move(600, 600); await settle(p, 500) }],
  ["hero-cta", async p => { await p.click("#herocta"); await p.mouse.move(5, 890); await settle(p) }],
  ["chip-농지", async p => { await p.click("#cats >> text=농지"); await settle(p, 300) }],
  ["chip-농지-off", async p => { await p.click("#cats >> text=농지"); await settle(p, 300) }],
  ["age", async p => { await p.fill("#age", "32"); await settle(p, 300) }],
  ["region", async p => { await p.selectOption("#reg", "제주시"); await settle(p, 300) }],
  ["exp", async p => { await p.selectOption("#exp", "1"); await settle(p, 300) }],
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
  ["sort-due", async p => { await p.selectOption("#sort", "due"); await settle(p, 300) }],
  ["hideend", async p => { await p.check("#hideend"); await settle(p, 300) }],
  ["page2", async p => { await p.click("#pager >> text=2"); await p.mouse.move(5, 890); await settle(p) }],
  ["page-prev", async p => { await p.click("#pager [aria-label='이전 페이지']"); await p.mouse.move(5, 890); await settle(p) }],
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
  ["tag-remove", async p => { const t = p.locator("#tags .tag").first(); if (await t.count()) await t.click(); await settle(p, 300) }],
  ["mega-intro", async p => { await p.click("#navhome"); await p.hover("#navrec"); await settle(p, 300); await p.click("#mega .intro"); await p.mouse.move(5, 890); await settle(p) }],
];
const mobile = [
  ["home", async p => { }],
  ["home-scroll", async p => { await p.evaluate(() => window.scrollTo(0, 900)); await settle(p, 300) }],
  ["menu-list", async p => { await p.click(".mitem >> text=정책 모아보기"); await settle(p) }],
  ["top", async p => { await p.evaluate(() => window.scrollTo(0, 0)); await settle(p, 300) }],
  ["chip-sts", async p => { await p.click("#sts >> text=확인 필요"); await settle(p, 300) }],
  ["open-card", async p => { await p.locator(".card").nth(0).locator("text=자세히 보기").first().click(); await settle(p) }],
  ["scroll-ex", async p => { await p.locator(".ex").first().scrollIntoViewIfNeeded(); await settle(p, 300) }],
  ["cal", async p => { await p.evaluate(() => window.scrollTo(0, 0)); await p.click("#navcal"); await settle(p) }],
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
    await pages[k].goto(URLS[k], { waitUntil: "networkidle" }); await pages[k].evaluate(() => document.fonts.ready); await settle(pages[k], 500);
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
