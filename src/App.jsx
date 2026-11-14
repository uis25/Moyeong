/*
 * 앱 레이아웃. 공유 상태는 app/AppProvider, 화면 조각은 features/ 에 있습니다.
 * 원본과 같은 DOM 순서를 유지합니다 (홈 → 검색 → 내 조건 → 달력 → 관심/기록 → 결과 막대 → 목록 → 쪽 번호 → 공식 링크).
 * LegacyMain: 아직 기능 폴더로 옮기지 않은 화면 (다음 단계에서 분리)
 */
import { Fragment } from "react";
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
import CalendarView from "./features/calendar/CalendarView";
import { RECORD_STATUSES } from "./constants/records";
import { deadlineMeta } from "./utils/policyStatus";

export default function App({ initial }) {
  return <AppProvider initial={initial}>
    <NavBar />
    <Hero />
    <main className="w">
      <HomeView />
      <SearchBox />
      <ConditionsPanel />
      <CalendarView />
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
      <section className="panel" id="sideview" style={view == "fav" || view == "rec" ? shown : hidden} aria-live="polite">{view == "fav" || view == "rec" ? renderSide() : null}</section>
  </>;
}
