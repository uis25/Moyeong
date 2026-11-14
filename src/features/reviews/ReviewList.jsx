// 후기 목록 (별점·키워드 필터, 정렬, 더 보기)
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import EmptyState from "../../components/EmptyState";
import ReviewItem from "./ReviewItem";
import { REVIEW_KEYWORDS, STAR_FILTERS, REVIEW_SORTS } from "../../constants/reviews";

export default function ReviewList({ list, ui, userId, act }) {
  return <>
    <div className="chips" role="group" aria-label="별점 필터">{STAR_FILTERS.map(n => <Chip key={n} pressed={ui.fs == n} onClick={() => act("fs", n)}>{n ? n + "점" : "전체"}</Chip>)}</div>
    <div className="chips" role="group" aria-label="키워드 필터">{REVIEW_KEYWORDS.map(k => <Chip key={k} pressed={ui.fk == k} onClick={() => act("fk", k)}>{k}</Chip>)}</div>
    <div className="chips" role="group" aria-label="정렬">{REVIEW_SORTS.map(([v, label]) => <Chip key={v} pressed={ui.sort == v} onClick={() => act("sort", v)}>{label}</Chip>)}</div>
    <div className="meta" style={{ marginTop: 12 }} aria-live="polite">{`후기 ${list.length}개`}</div>
    {list.length ? list.slice(0, ui.n).map(r => <ReviewItem key={r.id} review={r} mine={r.authorId == userId} />)
      : <EmptyState>조건에 맞는 후기 없음. 필터를 바꿔 보십시오.</EmptyState>}
    {list.length > ui.n ? <Button variant="soft" onClick={() => act("more")}>{`후기 더 보기 (${list.length - ui.n}개 남음)`}</Button> : null}
  </>;
}
