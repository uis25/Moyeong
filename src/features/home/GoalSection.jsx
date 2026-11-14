// 홈: '밭모영의 목표'
import { HOME_PILLARS } from "../../constants/navigation";

export default function GoalSection() {
  return <section className="goal" aria-labelledby="goal-t">
    <div className="eyebrow" id="goal-t">밭모영의 목표</div>
    <p className="lead">제주 청년농이 받을 수 있는 지원을 놓치지 않도록,<br />흩어진 공고를 한 밭에 모아 내 조건에 맞는 것부터 보여드립니다.</p>
    <div className="pillars">{HOME_PILLARS.map(([title, desc]) => <div className="pillar" key={title}><b>{title}</b><span>{desc}</span></div>)}</div>
  </section>;
}
