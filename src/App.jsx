/*
 * 앱 레이아웃. 공유 상태는 app/AppProvider, 화면 조각은 features/ 에 있습니다.
 * LegacyMain: 아직 기능 폴더로 옮기지 않은 화면 (다음 단계에서 차례로 분리)
 */
import { Fragment, useRef, useState } from "react";
import { flushSync } from "react-dom";
import AppProvider from "./app/AppProvider";
import { useApp } from "./app/AppContext";
import NavBar from "./features/navigation/NavBar";
import Hero from "./features/navigation/Hero";
import SiteFooter from "./features/navigation/SiteFooter";
import HomeView from "./features/home/HomeView";
import ReviewSection from "./features/reviews/ReviewSection";
import useReviews from "./features/reviews/useReviews";
import useDocumentEvent from "./hooks/useDocumentEvent";
import { CATEGORIES, STATUSES, EXPERIENCE_LABELS, PAGE_SIZE } from "./constants/conditions";
import { RECORD_STATUSES } from "./constants/records";
import { OFFICIAL_SOURCES } from "./constants/sources";
import { TODAY, pad2, ymd } from "./utils/date";
import { dday, status, deadlineMeta, shortCategory } from "./utils/policyStatus";
import { relatedWords, findSnippet, buildSuggestions } from "./utils/search";
import { pageNumbers } from "./utils/policyList";
import { mix, highlight, highlightParts, markInput } from "./utils/text";

const LBL = { ok: ["기본 조건 일치", "ok"], unknown: ["추가 확인 필요", "chk"], no: ["조건 불일치", "no"] }, CL = { ok: "일치", unknown: "확인 필요", no: "불일치" };
function range(a, b, u) { return a == null && b == null ? "명시 없음" : (a ?? "") + "~" + (b ?? "") + u }

export default function App({ initial }) {
  return <AppProvider initial={initial}>
    <NavBar />
    <Hero />
    <LegacyMain />
    <SiteFooter />
  </AppProvider>;
}

function LegacyMain() {
  const { policies, userId: UID, conditions: S, favorites: fav, documents: docs, records: REC, view, openId: open, queryInput: qInput, query: Q, sort, hideMismatch: hide, hideClosed: hideend, tick,
    QX, QRE, list: L, page, totalPages: tp, refs, bump, search, changeQueryInput, clearQuery, changeCondition, toggleFilter: toggleChip, removeTag, resetAll, changeSort, changeHideMismatch, changeHideClosed, changePage,
    toggleOpen, toggleFavorite: toggleFav, toggleRecord: toggleRec, toggleDocument: toggleDoc, sortGo, goTarget: goHome, openPolicy } = useApp();
  const reviews = useReviews();
  const [calY, setCalY] = useState(TODAY.getFullYear());
  const [calM, setCalM] = useState(TODAY.getMonth());
  const [calSel, setCalSel] = useState(null);
  const [calAll, setCalAll] = useState(false);
  const [ac, setAc] = useState({ items: [], i: -1, mv: "" });
  const acT = useRef(null), qInputRef = useRef(""), dayRefs = useRef({}), cpxRef = useRef(null);
  qInputRef.current = qInput;
  const syn = relatedWords(QX);
  const main = view == "list";

  /* ---- 자동완성 ---- */
  function acClose() { clearTimeout(acT.current); setAc({ items: [], i: -1, mv: "" }) }
  function acShow(items, i) { if (!items.length) { acClose(); return } setAc({ items, i, mv: qInputRef.current }) }
  const acOpen = ac.items.length > 0;


  function doSearch(value = qInput) { acClose(); search(value) }
  function acPick(i) { const o = ac.items[i]; if (!o) return; doSearch(o.v) }
  function onQChange(e) {
    const v = e.target.value; clearTimeout(acT.current);
    if (!v.trim()) acClose();
    else acT.current = setTimeout(() => { acShow(buildSuggestions(v, policies), -1) }, 250);
    changeQueryInput(v);
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
    /* 원본 render()는 매번 입력칸 값을 다시 써서, 숫자가 아닌 입력(예: "1e")은 지워졌습니다 */
    if (field == "age") e.target.value = v;
    changeCondition(field, v);
  }
  function onSortGo(e, v) { e.preventDefault(); sortGo(v) }
  function onPage(e, n, disabled) { if (disabled) return; changePage(n) }

  /* ---- 달력 ---- */
  function calNav(d0) { const d = new Date(calY, calM + d0, 1); setCalY(d.getFullYear()); setCalM(d.getMonth()); setCalSel(null) }
  function calDay(k) {
    const ns = calSel == k ? null : k; flushSync(() => setCalSel(ns));
    const f = ns ? cpxRef.current : dayRefs.current[k]; if (f) f.focus({ preventScroll: true });
  }
  function calClose() { const k = calSel; flushSync(() => setCalSel(null)); const b = dayRefs.current[k]; if (b) b.focus({ preventScroll: true }) }


  /* 달력 바깥 클릭 시 팝업 닫기. 원본에서 이 리스너보다 먼저 등록돼 화면을 바꾸던 버튼(#herocta, [data-sortgo], #navcond, #navfav)은
     누른 시점에 이미 달력 화면이 아니게 되어 팝업이 닫히지 않았으므로 똑같이 제외합니다. */
  useDocumentEvent("click", e => {
    if (view == "cal" && calSel && !e.target.closest(".calpop,[data-calday],[data-calnav]") && !e.target.closest("#herocta,[data-sortgo],#navcond,#navfav")) setCalSel(null);
  }, true);
  useDocumentEvent("keydown", e => {
    if (e.key == "Escape" && view == "cal" && calSel) { flushSync(() => setCalSel(null)); const b = dayRefs.current[calSel]; if (b) b.focus() }
  });

  /* ================= 렌더 ================= */
  const tags = []; if (S.age !== "") tags.push(["age", `만 ${S.age}세`]); if (S.region) tags.push(["region", S.region]); if (S.exp !== "") tags.push(["exp", EXPERIENCE_LABELS[S.exp]]); if (S.biz !== "") tags.push(["biz", S.biz === "1" ? "경영체 등록" : "경영체 미등록"]); S.cats.forEach(c => tags.push(["cats:" + c, c])); S.sts.forEach(c => tags.push(["sts:" + c, c]));

  function renderPager() {
    if (tp <= 1) return null;
    const nums = pageNumbers(page, tp);
    const out = [<button key="prev" data-page={page - 1} aria-disabled={page == 1} aria-label="이전 페이지" onClick={e => onPage(e, page - 1, page == 1)}>‹<span className="pt"> 이전</span></button>]; let prev = 0;
    nums.forEach(n => { if (n - prev > 1) out.push(<span key={"g" + n} className="gap" aria-hidden="true">…</span>); out.push(<button key={n} data-page={n} aria-current={n == page ? "page" : undefined} aria-label={`${n}페이지`} onClick={e => onPage(e, n, false)}>{n}</button>); prev = n });
    out.push(<button key="next" data-page={page + 1} aria-disabled={page == tp} aria-label="다음 페이지" onClick={e => onPage(e, page + 1, page == tp)}><span className="pt">다음 </span>›</button>);
    return out;
  }

  function recBlock(p) {
    return <><h4>신청 기록</h4><div className="chips" role="group" aria-label="신청 기록">{RECORD_STATUSES.map(s => <button key={s} className="chip" aria-pressed={REC[p.id] == s} onClick={() => toggleRec(p.id, s)}>{s}</button>)}</div><div className="note">직접 고르는 진행 상태 (다시 누르면 기록 삭제, 이 기기에만 저장)</div></>
  }

  function card(x) {
    const p = x.p, o = open == p.id, b = LBL[x.e.overall], d = p.applicationEnd ? dday(p) : null;
    const dl = x.st == "마감" || x.st == "접수 예정" || x.st == "확인 필요" ? "" : d == 0 ? "D-day" : d != null ? "D-" + d : "";
    const isFav = fav.includes(p.id);
    const extLink = (url, label, s) => url ? <a className={`btn ${s}`} href={url} target="_blank" rel="noopener">{`${label} ↗`}</a> : <a className={`btn ${s}`} aria-disabled="true" style={{ opacity: .45, pointerEvents: "none" }}>{`${label} ↗`}</a>;
    return <article className={`card ${x.e.overall == "no" ? "dim" : ""}`} id={`card-${p.id}`} key={p.id} ref={el => { refs.cards.current[p.id] = el }}>
      <div className="top"><div><span className={`badge ${b[1]}`}>{b[0]}</span><span className={`badge ${x.st == "마감 임박" ? "dd" : "gr"}`}>{`${x.st} ${dl}`}</span><h3>{highlight(p.title, QRE)}</h3>
        <div className="meta">{mix(highlightParts(p.organization, QRE), " · ", p.eligibleFarmerTypes.join(", ") || "지원 대상 명시 없음")}<br />{mix(`신청 ${p.applicationStart || "?"} ~ ${p.applicationEnd || "?"} · `, highlightParts(p.supportType.join("/"), QRE))}</div>{(sn => sn ? <div className="qsnip"><span className="k">검색어 일치</span>{mix(sn.before ? "…" : "", highlightParts(sn.text, QRE), sn.after ? "…" : "")}</div> : null)(findSnippet(p, QRE))}</div>
        <button className="ic" aria-pressed={isFav} aria-label={`관심 정책 ${isFav ? "해제" : "등록"}`} onClick={() => toggleFav(p.id)}>{isFav ? "★ 관심" : "☆ 관심"}</button></div>
      <div className="cact"><button className="btn s" aria-expanded={o} ref={el => { refs.openButtons.current[p.id] = el }} onClick={() => toggleOpen(p.id)}>{o ? "접기" : "자세히 보기"}</button>{p.applicationUrl || p.officialNoticeUrl ? <a className="btn s" href={p.applicationUrl || p.officialNoticeUrl} target="_blank" rel="noopener noreferrer">{`${p.applicationUrl ? "공식 신청 페이지" : "공식 공고문"} ↗`}</a> : <span className="btn s" aria-disabled="true" style={{ opacity: .45, cursor: "default" }}>공식 링크 없음</span>}</div>
      {o ? <div className="ex" key={tick}><p style={{ margin: 0 }}>{highlight(p.description, QRE)}</p>
        <div className="ex2"><div className="exc"><h4>신청 대상 및 자격</h4>{p.eligibilityDetails.length ? <ul>{p.eligibilityDetails.map((t, i) => <li key={i}>{highlight(t, QRE)}</li>)}</ul> : <div className="meta">공고에 명시된 내용 없음</div>}</div><div className="exc"><h4>내 조건과 비교 <span className="meta">(참고용)</span></h4>
          <table className="cmp"><tbody>{x.e.checks.map(c => <tr key={c[0]}><td>{c[0]}</td><td><span className={`badge ${LBL[c[1]][1]}`}>{CL[c[1]]}</span></td></tr>)}</tbody></table>
          <div className="note">{`정책 기준: 연령 ${range(p.minAge, p.maxAge, "세")} · 영농경력 ${range(p.minFarmingYears, p.maxFarmingYears, "년")} · 지역 ${p.eligibleRegions.join(", ") || "명시 없음"} · 농업경영체 등록 ${p.requiresBusinessRegistration == null ? "명시 없음" : p.requiresBusinessRegistration ? "필요" : "불필요"}. 이 비교는 공식 자격 심사가 아니며, 다른 필수 자격이 있을 수 있습니다.`}</div></div></div>
        <h4>준비 서류 체크리스트</h4>{p.requiredDocuments.length ? <ul>{p.requiredDocuments.map((t, i) => <li className="d" key={i}><label className="doc"><input type="checkbox" checked={!!docs[p.id + ":" + i]} onChange={e => toggleDoc(p.id, i, e.target.checked)} />{t}</label></li>)}</ul> : <div className="meta">확인된 서류 없음. 공식 공고를 확인하십시오.</div>}
        <ReviewSection policy={p} reviews={reviews} />{recBlock(p)}<h4>참고 링크</h4>
        <div className="links">{extLink(p.applicationUrl, "공식 신청 페이지", p.applicationUrl ? "" : "s")}{extLink(p.officialNoticeUrl, "공식 공고문", "s")}</div>
        <div className="note">{p.applicationUrl || p.officialNoticeUrl ? "외부 사이트로 이동합니다." : "확인된 공식 링크가 없습니다. 아래 참고 링크나 해당 기관 사이트에서 공고를 확인해 주십시오."}</div>{(p.references || []).length ? <ul className="refs">{p.references.map((r, i) => <li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer">{`${r.label} ↗`}</a></li>)}</ul> : null}<div className="note">{`출처: ${p.sourceName} · 확인일 ${p.lastVerifiedAt || "미확인"}`}</div></div> : null}
    </article>
  }

  function renderCal() {
    const first = new Date(calY, calM, 1).getDay(), days = new Date(calY, calM + 1, 0).getDate(), pre = calY + "-" + pad2(calM + 1), ev = {}, sv = {};
    policies.forEach(p => { if (p.applicationEnd && p.applicationEnd.startsWith(pre)) (ev[p.applicationEnd] = ev[p.applicationEnd] || []).push(p); if (p.applicationStart && p.applicationStart.startsWith(pre)) (sv[p.applicationStart] = sv[p.applicationStart] || []).push(p) });
    const sel = calSel && calSel.startsWith(pre) ? calSel : null;
    if (sel !== calSel) setCalSel(sel);
    const ts = ymd(TODAY);
    const row = (k, p, t, key) => <div className="alr" key={key}><span className={`badge ${t == "마감" ? "dd" : "ok"}`}>{`${k.slice(5).replace("-", "/")} ${t}`}</span><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button></div>;
    const calPop = (k, col, s2, e) => <div className={`calpop ${col < 2 ? "al" : col > 4 ? "ar" : ""}`} role="dialog" aria-label={`${+k.slice(5, 7)}월 ${+k.slice(8)}일 일정`}><div className="cph"><b>{`${+k.slice(5, 7)}월 ${+k.slice(8)}일 일정`}</b><button className="cpx" aria-label="닫기" ref={cpxRef} onClick={calClose}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>{(s2 || []).map(p => row(k, p, "접수 시작", "s" + p.id))}{(e || []).map(p => row(k, p, "마감", "e" + p.id))}</div>;
    const cells = ["일", "월", "화", "수", "목", "금", "토"].map(d => <div className="dow" aria-hidden="true" key={"w" + d}>{d}</div>);
    for (let i = 0; i < first; i++)cells.push(<div key={"b" + i}></div>);
    for (let d = 1; d <= days; d++) {
      const k = pre + "-" + pad2(d), e = ev[k], s2 = sv[k], lab = `${calM + 1}월 ${d}일${e ? " 마감 " + e.length + "건" : ""}${s2 ? " 접수 시작 " + s2.length + "건" : ""}`;
      const inner = <><span className="dn">{d}</span>{(s2 || []).map(p => <span className="cnt s" key={"s" + p.id}>{shortCategory(p)}</span>)}{(e || []).map(p => <span className="cnt" key={"e" + p.id}>{shortCategory(p)}</span>)}</>;
      const col = (first + d - 1) % 7;
      cells.push(e || s2 ? <div className="dcell" style={{ "--c": col }} key={k}><button className={`day${k == ts ? " today" : ""}`} data-calday={k} aria-pressed={sel == k} aria-expanded={sel == k} aria-haspopup="dialog" aria-label={lab} ref={el => { dayRefs.current[k] = el }} onClick={() => calDay(k)}>{inner}</button>{sel == k ? calPop(k, col, s2, e) : null}</div>
        : <div className={`day${k == ts ? " today" : ""}`} aria-label={lab} key={k}>{inner}</div>);
    }
    const keys = [...new Set([...Object.keys(ev), ...Object.keys(sv)])].sort();
    const list = keys.flatMap(k => [...(sv[k] || []).map(p => row(k, p, "접수 시작", "s" + k + p.id)), ...(ev[k] || []).map(p => row(k, p, "마감", "e" + k + p.id))]);
    const und = policies.filter(p => !p.applicationEnd);
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
      const FL = policies.filter(p => fav.includes(p.id));
      return <><h2 style={{ margin: "0 0 8px" }}>관심 정책 <span className="meta">{`${FL.length}건`}</span></h2>
        {FL.length ? FL.map(p => <div className="alr" style={{ justifyContent: "space-between" }} key={p.id}><div><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button><div className="meta">{deadlineMeta(p)}</div></div><button className="ic" aria-pressed="true" aria-label="관심 정책 해제" onClick={() => toggleFav(p.id)}>★ 해제</button></div>)
          : <div className="empty">관심 정책 없음<br />정책 카드의 ☆ 관심을 누르면 이곳에 모입니다.</div>}</>
    }
    const ids = Object.keys(REC).filter(id => policies.some(p => p.id == id));
    return <><h2 style={{ margin: "0 0 8px" }}>신청 기록 <span className="meta">{`${ids.length}건`}</span></h2>
      {ids.length ? RECORD_STATUSES.map(s => {
        const RL = ids.filter(id => REC[id] == s).map(id => policies.find(p => p.id == id)); return RL.length ? <Fragment key={s}><h3 style={{ fontSize: 16, margin: "16px 0 4px" }}>{`${s} `}<span className="meta">{`${RL.length}건`}</span></h3>
          {RL.map(p => <div className="rvi" key={p.id}><button className="lnk" onClick={() => openPolicy(p.id)}>{p.title}</button><div className="meta">{deadlineMeta(p)}</div><div className="chips" role="group" aria-label="진행 상태">{RECORD_STATUSES.map(x => <button key={x} className="chip" aria-pressed={REC[p.id] == x} onClick={() => toggleRec(p.id, x)}>{x}</button>)}<button className="ic" onClick={() => toggleRec(p.id, s)}>기록 삭제</button></div></div>)}</Fragment> : null
      }) : <div className="empty">신청 기록 없음<br />정책 상세의 '신청 기록'에서 진행 상태를 선택하십시오.</div>}</>
  }

  const hidden = { display: "none" }, shown = { display: "" };

  return     <main className="w">
      <HomeView />
      <section className="panel" id="searchbox" role="search" aria-label="정책 검색" style={main ? shown : hidden}><div className="search"><div className="qwrap">
        <input id="q" ref={refs.q} type="search" placeholder="정책명, 기관, 키워드 검색 (예: 농기계, 땅, 교육)" aria-label="정책 검색" role="combobox" aria-autocomplete="list" aria-expanded={acOpen} aria-controls="ac" aria-activedescendant={acOpen && ac.i >= 0 ? "ac-" + ac.i : undefined} autoComplete="off"
          value={qInput} onChange={onQChange} onKeyDown={onQKeyDown} onBlur={() => { setTimeout(acClose, 120) }} />
        <ul id="ac" className="ac" role="listbox" aria-label="추천 검색어" hidden={!acOpen} onMouseDown={e => e.preventDefault()}>{ac.items.map((o, i) => <li key={i} id={`ac-${i}`} role="option" aria-selected={i == ac.i} onClick={() => acPick(i)}><span className="k">{o.kind}</span><span className="t">{markInput(o.v, ac.mv)}</span></li>)}</ul>
      </div><button className="btn" id="goto" onClick={e => { e.preventDefault(); doSearch() }}>맞춤 정책 찾기</button></div>
        <p id="qinfo" className="qinfo" hidden={!Q}>{Q ? <><b>{`'${Q}'`}</b>{` 검색 결과${syn.length ? ` · 함께 찾은 말: ${syn.slice(0, 6).join(", ")}` : ""} `}<button className="ic qclear" onClick={clearQuery}>검색어 지우기</button></> : null}</p></section>
      <section className="panel" id="top-panel" ref={refs.topPanel} style={main ? shown : hidden}><div className="phead"><h2>내 조건</h2><p className="hint">나이·지역·경력·경영체 등록 여부를 입력하면 기본 조건이 맞는 정책을 먼저 보여드립니다. 조건은 이 기기에만 저장됩니다.</p></div>
        <div className="frow"><span className="flab" id="cats-l">카테고리</span><div className="chips" id="cats" role="group" aria-labelledby="cats-l" ref={refs.cats}>{CATEGORIES.map(x => <button key={x} className="chip" aria-pressed={S.cats.includes(x)} onClick={() => toggleChip("cats", x)}>{x}</button>)}</div></div>
        <div className="frow"><span className="flab" id="sts-l">모집 상태</span><div className="chips" id="sts" role="group" aria-labelledby="sts-l" ref={refs.sts}>{STATUSES.map(x => <button key={x} className="chip" aria-pressed={S.sts.includes(x)} onClick={() => toggleChip("sts", x)}>{x}</button>)}</div></div>
        <div className="row"><div><label htmlFor="age">만 나이</label><input id="age" ref={refs.age} type="number" min="0" max="120" placeholder="예: 32" value={S.age} onChange={e => onCondChange("age", e)} /></div>
          <div><label htmlFor="reg">영농 지역</label><select id="reg" value={S.region} onChange={e => onCondChange("region", e)}><option value="">선택 안 함</option><option>제주시</option><option>서귀포시</option></select></div>
          <div><label htmlFor="exp">영농경력</label><select id="exp" value={S.exp} onChange={e => onCondChange("exp", e)}><option value="">선택 안 함</option><option value="0">영농 준비 중</option><option value="1">1년 미만</option><option value="2">1~2년</option><option value="3">3~5년</option><option value="4">5년 초과</option></select></div>
          <div><label htmlFor="biz">농업경영체 등록</label><select id="biz" value={S.biz} onChange={e => onCondChange("biz", e)}><option value="">선택 안 함</option><option value="1">등록함</option><option value="0">등록 안 함</option></select></div></div>
        <div className="chips" id="tags" aria-live="polite">{tags.length ? <button className="ic" id="reset" onClick={resetAll}>전체 초기화</button> : null}{tags.map(t => <button key={t[0]} className="tag" aria-label={`${t[1]} 필터 해제`} onClick={() => removeTag(t[0])}>{`${t[1]} ✕`}</button>)}</div></section>
      <section className="panel" id="calview" style={view == "cal" ? shown : hidden} aria-label="신청 달력">{view == "cal" ? renderCal() : null}</section>
      <section className="panel" id="sideview" style={view == "fav" || view == "rec" ? shown : hidden} aria-live="polite">{view == "fav" || view == "rec" ? renderSide() : null}</section>
      <div className="bar" ref={refs.bar} style={main ? shown : hidden}><strong id="cnt">{`검색 결과 ${L.length}건`}</strong><div><label className="sl">정렬 <select id="sort" value={sort} onChange={e => changeSort(e.target.value)}><option value="fit">나에게 맞는 정책순</option><option value="due">마감 임박순</option><option value="new">최신 등록순</option></select></label>
        <label className="ck"><input type="checkbox" id="hide" checked={hide} onChange={e => changeHideMismatch(e.target.checked)} /> 조건 불일치 숨기기</label><label className="ck"><input type="checkbox" id="hideend" checked={hideend} onChange={e => changeHideClosed(e.target.checked)} /> 마감 정책 숨기기</label></div></div>
      <div id="list" style={main ? shown : hidden}>{L.length ? L.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(card) : <div className="empty"><b>조건에 맞는 정책 없음</b><br />{`${Q ? `'${Q}' 대신 더 짧거나 일반적인 말(예: 농지, 자금, 교육)로 검색하거나 ` : ""}필터를 줄이거나 '조건 불일치 숨기기'·'마감 정책 숨기기'를 해제하십시오.`}</div>}</div>
      <div className="pager" id="pager" role="navigation" aria-label="정책 목록 페이지" hidden={tp <= 1} style={main ? shown : hidden}>{renderPager()}</div>
      <section className="panel" id="srcs" ref={refs.srcs} style={main ? shown : hidden}><h2>공식 공고 바로가기</h2><p className="hint">도청, 시청, 농업기술센터, 농어촌공사 공고를 한곳에서 확인하시기 바랍니다. 새 공고는 아래 공식 사이트에 먼저 올라오고, 이 페이지의 정보와 다르면 공식 사이트가 기준입니다.</p><div className="chips">{OFFICIAL_SOURCES.map(([href, label]) => <a key={href} className="chip" style={{ textDecoration: "none", color: "inherit" }} href={href} target="_blank" rel="noopener noreferrer">{`${label} ↗`}</a>)}</div></section>
      <footer>⚠ 정책 정보는 공개된 공고·보도자료를 바탕으로 정리한 것이며 확인일은 카드에 표시됩니다. 신청 기간과 자격은 바뀔 수 있습니다. 조건 비교는 참고용이며 공식 자격 심사가 아닙니다. 최종 신청 자격은 반드시 공식 공고문에서 확인하시기 바랍니다.</footer></main>;
}
