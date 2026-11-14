// 정책 상세 안의 '선배가 해보니' 영역. reviews: useReviews()의 반환값 (목록 화면에서 한 번만 만들어 전달)
import Button from "../../components/Button";
import ReviewStats from "./ReviewStats";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import { reviewStats, sortReviews } from "../../utils/reviewStats";

export default function ReviewSection({ policy, reviews }) {
  const pid = policy.id, ui = reviews.uiOf(pid), all = reviews.reviewsOf(pid), stats = reviewStats(all);
  const mine = all.find(r => r.authorId == reviews.userId);
  const act = (a, v) => reviews.act(a, pid, v);
  const list = ui.open && stats.n ? sortReviews(all.filter(r => (!ui.fs || r.rating == ui.fs) && (!ui.fk || r.keywords.includes(ui.fk))), ui.sort) : null;

  return <section className="rv"><h4>선배가 해보니</h4>
    {stats.n ? <ReviewStats stats={stats} /> : <div className="meta">등록된 후기 없음. 첫 후기를 남겨 주십시오.</div>}
    <Button variant="soft" aria-expanded={ui.open} hidden={!stats.n} onClick={() => act("open")}>{ui.open ? "접기" : "자세히 보기"}</Button>
    <Button variant="soft" onClick={() => act("write")}>{ui.write ? "작성 취소" : mine ? "내 후기 수정" : "후기 쓰기"}</Button>
    {mine ? <Button variant="soft" disabled={ui.busy} onClick={() => act("del")}>내 후기 삭제</Button> : null}
    {ui.msg ? <div className="note" role="status">{ui.msg}</div> : null}
    {ui.write ? <ReviewForm policyId={pid} ui={ui} act={act} setDraft={v => reviews.setDraft(pid, v)} /> : null}
    {list ? <ReviewList list={list} ui={ui} userId={reviews.userId} act={act} /> : null}
  </section>;
}
