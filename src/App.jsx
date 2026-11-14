/*
 * 앱 레이아웃. 공유 상태는 app/AppProvider, 화면 조각은 features/ 에 있습니다.
 * 원본과 같은 DOM 순서를 유지합니다 (홈 → 검색 → 내 조건 → 달력 → 관심/기록 → 결과 막대 → 목록 → 쪽 번호 → 공식 링크).
 * LegacyMain: 아직 기능 폴더로 옮기지 않은 화면 (다음 단계에서 분리)
 */
import { Fragment, useRef, useState } from "react";
import { flushSync } from "react-dom";
import AppProvider from "./app/AppProvider";
import { useApp } from "./app/AppContext";
import NavBar from "./features/navigation/NavBar";
import Hero from "./features/navigation/Hero";
import SiteFooter from "./features/navigation/SiteFooter";
import HomeView from "./features/home/HomeView";
import SearchBox from "./features/policies/SearchBox";
import ConditionsPanel from "./features/policies/ConditionsPanel";
import ResultBar from "./features/policies/ResultBar";
import PolicyList from "./features/policies/PolicyList";
import Pager from "./features/policies/Pager";
import OfficialSources from "./features/policies/OfficialSources";
import useDocumentEvent from "./hooks/useDocumentEvent";
import { RECORD_STATUSES } from "./constants/records";
import { TODAY, pad2, ymd } from "./utils/date";
import { deadlineMeta, shortCategory } from "./utils/policyStatus";

export default function App({ initial }) {
  return <AppProvider initial={initial}>
    <NavBar />
    <Hero />
    <main className="w">
      <HomeView />
      <SearchBox />
      <ConditionsPanel />
      <LegacyMain />
      <ResultBar />
      <PolicyList />
      <Pager />
      <OfficialSources />
      <footer>⚠ 정책 정보는 공개된 공고·보도자료를 바탕으로 정리한 것이며 확인일은 카드에 표시됩니다. 신청 기간과 자격은 바뀔 수 있습니다. 조건 비교는 참고용이며 공식 자격 심사가 아닙니다. 최종 신청 자격은 반드시 공식 공고문에서 확인하시기 바랍니다.</footer>
    </main>
    <SiteFooter />
  </AppProvider>;
}

function LegacyMain() {
  const { policies, favorites: fav, records: REC, view, toggleFavorite: toggleFav, toggleRecord: toggleRec, openPolicy } = useApp();
  const [calY, setCalY] = useState(TODAY.getFullYear());
  const [calM, setCalM] = useState(TODAY.getMonth());
  const [calSel, setCalSel] = useState(null);
  const [calAll, setCalAll] = useState(false);
  const dayRefs = useRef({}), cpxRef = useRef(null);

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
  return <>
      <section className="panel" id="calview" style={view == "cal" ? shown : hidden} aria-label="신청 달력">{view == "cal" ? renderCal() : null}</section>
      <section className="panel" id="sideview" style={view == "fav" || view == "rec" ? shown : hidden} aria-live="polite">{view == "fav" || view == "rec" ? renderSide() : null}</section>
  </>;
}
