// 달력 화면 내용 (월 이동 · 범례 · 달력 · 이번 달 일정 · 마감일 미정 정책)
import Button from "../../components/Button";
import PolicyRow from "../../components/PolicyRow";
import CalendarGrid from "./CalendarGrid";

/** 날짜별로 정책 묶기 { "YYYY-MM-DD": [정책] } (해당 달만) */
function groupByDate(policies, field, prefix) {
  const out = {};
  policies.forEach(p => { const d = p[field]; if (d && d.startsWith(prefix)) (out[d] = out[d] || []).push(p) });
  return out;
}

export default function CalendarBody({ cal, policies, prefix }) {
  const ends = groupByDate(policies, "applicationEnd", prefix), starts = groupByDate(policies, "applicationStart", prefix);
  const dates = [...new Set([...Object.keys(ends), ...Object.keys(starts)])].sort();
  const monthRows = dates.flatMap(d => {
    const md = d.slice(5).replace("-", "/");
    return [...(starts[d] || []).map(p => <PolicyRow key={"s" + d + p.id} policy={p} badge={`${md} 접수 시작`} badgeVariant="ok" />),
      ...(ends[d] || []).map(p => <PolicyRow key={"e" + d + p.id} policy={p} badge={`${md} 마감`} badgeVariant="dd" />)];
  });
  const undecided = policies.filter(p => !p.applicationEnd);

  return <>
    <div className="top">
      <Button variant="outline" data-calnav="-1" aria-label="이전 달" onClick={() => cal.moveMonth(-1)}>‹</Button>
      <h2 style={{ margin: 0 }}>{`${cal.year}년 ${cal.month + 1}월 신청 일정`}</h2>
      <Button variant="outline" data-calnav="1" aria-label="다음 달" onClick={() => cal.moveMonth(1)}>›</Button>
    </div>
    <div className="calleg" aria-hidden="true"><span><i className="lg s"></i>접수 시작</span><span><i className="lg"></i>마감</span></div>
    <CalendarGrid cal={cal} prefix={prefix} starts={starts} ends={ends} />
    <h3 style={{ fontSize: 16, margin: "20px 0 4px" }}>이번 달 일정</h3>
    <div className="clist">{monthRows.length ? monthRows : <div className="meta">이번 달 접수 시작·마감 일정 없음</div>}</div>
    <h3 style={{ fontSize: 16, margin: "20px 0 4px" }}>마감일이 정해지지 않은 정책 <span className="meta">{`${undecided.length}건`}</span></h3>
    <div className="clist">{(cal.showAll ? undecided : undecided.slice(0, 6)).map(p => <PolicyRow key={p.id} policy={p} badge="확인 필요" badgeVariant="chk" />)}</div>
    {undecided.length > 6 ? <Button variant="outline" className="calmore" aria-expanded={cal.showAll} onClick={() => cal.setShowAll(a => !a)}>{cal.showAll ? "접기" : `${undecided.length}건 모두 보기`}</Button> : null}
    <div className="note">날짜를 누르면 그날 일정을 볼 수 있습니다. 공개된 공고 기준이며, 실제 일정은 공식 공고문에서 확인하시기 바랍니다.</div>
  </>;
}
