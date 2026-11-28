// 화면별 이용 가이드 (제목 아래 상자). 오른쪽 위 '가이드 닫기 ✕'로 닫고, 닫은 뒤에는 '이용 가이드'로 다시 열기
// 닫은 상태는 화면마다 따로 이 기기에 저장 (guideService)
import { useEffect, useRef, useState } from "react";
import { PAGE_GUIDES } from "../../constants/navigation";
import { loadClosedGuides, saveClosedGuides } from "../../services/guideService";
import { useApp } from "../../app/AppContext";

/** 설명 문장: 문자열은 그대로, [글자, 종류]는 굵게 강조 */
const rich = parts => parts.map((x, i) => typeof x == "string" ? x : <b key={i} className={x[1] ? "g" + x[1] : undefined}>{x[0]}</b>);

export default function PageGuide() {
  const { view } = useApp();
  const [closed, setClosed] = useState(loadClosedGuides);
  const focusRef = useRef(null), moved = useRef(false);
  const g = PAGE_GUIDES[view], isClosed = closed.includes(view);

  // 닫으면 '이용 가이드'로, 다시 열면 '가이드 닫기'로 포커스 (누른 버튼이 사라지므로)
  useEffect(() => { if (moved.current) { moved.current = false; focusRef.current?.focus() } }, [isClosed]);
  function toggle(close) {
    const next = close ? [...closed.filter(v => v != view), view] : closed.filter(v => v != view);
    moved.current = true; setClosed(next); saveClosedGuides(next);
  }

  if (!g) return null;
  if (isClosed) return <div className="guideopen"><button type="button" className="lnk" ref={focusRef} onClick={() => toggle(false)}>이용 가이드</button></div>;
  return <section className="guide" aria-labelledby="guide-h">
    <div className="ghead"><h2 id="guide-h">{g.title}</h2><button type="button" className="gclose" ref={focusRef} onClick={() => toggle(true)}>가이드 닫기<span aria-hidden="true">✕</span></button></div>
    {g.flow
      ? <><ol className="gflow">{g.flow.map(x => <li key={x}><span>{x}</span></li>)}</ol><p className="gtext">{rich(g.text)}</p></>
      : <ol className="gsteps">{g.steps.map(([t, d], i) => <li key={t}><span className="gnum" aria-hidden="true">{i + 1}</span><div><b>{t}</b><p>{rich(d)}</p></div></li>)}</ol>}
  </section>;
}
