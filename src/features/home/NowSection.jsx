// 홈: '지금 확인할 정책' 3개 (모집 중·접수 예정 우선, 없으면 최근 등록순)
import Badge, { statusVariant } from "../../components/Badge";
import { dday, status } from "../../utils/policyStatus";
import { useApp } from "../../app/AppContext";

const OPEN_STATUSES = ["모집 중", "마감 임박", "접수 예정"];

export default function NowSection() {
  const { policies, sortGo, openPolicy } = useApp();
  const all = policies.map(p => ({ p, st: status(p) }));
  const open = all.filter(x => OPEN_STATUSES.includes(x.st)).sort((a, b) => (a.p.applicationEnd || "9").localeCompare(b.p.applicationEnd || "9"));
  const recent = all.filter(x => !open.includes(x)).sort((a, b) => (b.p.reg || "").localeCompare(a.p.reg || ""));
  const pick = [...open, ...recent].slice(0, 3);

  return <section className="hsec" aria-labelledby="now-t">
    <div className="hhead"><h2 id="now-t">{open.length ? "지금 확인할 정책" : "최근 등록된 정책"}</h2><button className="more" data-sortgo="" onClick={e => { e.preventDefault(); sortGo("") }}>전체 정책 모아보기 ›</button></div>
    <p className="hint">{open.length ? "모집 중이거나 곧 접수가 시작되는 정책입니다." : "현재 모집 중인 정책이 없어 최근 등록 순으로 보여드립니다."}</p>
    <div className="nowlist">{pick.map(({ p, st }) => {
      const d = p.applicationEnd && st != "마감" ? dday(p) : null;
      return <button key={p.id} className="nowc" onClick={() => openPolicy(p.id)}>
        <span><Badge variant={statusVariant(st)}>{st + (d != null && st != "접수 예정" ? (d == 0 ? " D-day" : " D-" + d) : "")}</Badge></span>
        <b>{p.title}</b><span className="meta">{p.organization}</span>
      </button>;
    })}</div>
  </section>;
}
