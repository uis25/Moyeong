// 후기 통계: 평균 별점 · 키워드 비율 막대 · 요약 문장
import { reviewSummary } from "../../utils/reviewStats";

export default function ReviewStats({ stats }) {
  const pct = x => Math.round(x.c / stats.n * 100);
  return <>
    <div><span className="big">{`★ ${stats.avg.toFixed(1)}`}</span><span className="meta">{`/ 5 · 후기 ${stats.n}개`}</span></div>
    {stats.top.map(x => <div className="bar2" key={x.k}>
      <span>{x.k}</span>
      <span className="bt" role="img" aria-label={`${pct(x)}%`}><i style={{ width: `${x.c / stats.n * 100}%` }}></i></span>
      <span className="bn">{`${x.c}명 · ${pct(x)}%`}</span>
    </div>)}
    <div className="rvs">{reviewSummary(stats)}<div className="note">키워드 빈도 기반 요약 (AI 요약 아님). 후기는 사용자 경험이며 공식 정책 정보가 아닙니다.</div></div>
  </>;
}
