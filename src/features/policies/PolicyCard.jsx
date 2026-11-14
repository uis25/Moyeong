// 정책 카드 (모집 상태 배지 · 제목 · 기관 · 관심 버튼 · 자세히 보기)
// 원본과 다른 점: 자격 판정 배지 없음, 상태별 배지 색 구분, 공식 링크가 없으면 "공식 공고문" 버튼을 흐리게 표시 (docs/differences.md)
import Badge, { STATUS_VARIANT } from "../../components/Badge";
import Button from "../../components/Button";
import SearchSnippet from "./SearchSnippet";
import PolicyDetail from "./PolicyDetail";
import { dday } from "../../utils/policyStatus";
import { mix, highlight, highlightParts } from "../../utils/text";
import { useApp } from "../../app/AppContext";

export default function PolicyCard({ item, reviews }) {
  const { openId, favorites, QRE, refs, toggleOpen, toggleFavorite } = useApp();
  const { p, e, st } = item;
  const isOpen = openId == p.id, isFav = favorites.includes(p.id);
  const d = p.applicationEnd ? dday(p) : null;
  const dl = st == "마감" || st == "접수 예정" || st == "확인 필요" ? "" : d == 0 ? "D-day" : d != null ? "D-" + d : "";
  const officialUrl = p.applicationUrl || p.officialNoticeUrl;

  return <article className={`card${e.overall == "no" ? " dim" : ""}`} id={`card-${p.id}`} ref={el => { refs.cards.current[p.id] = el }}>
    <div className="top">
      <div>
        <Badge variant={STATUS_VARIANT[st]}>{`${st} ${dl}`}</Badge>
        <h3>{highlight(p.title, QRE)}</h3>
        <div className="meta">{mix(highlightParts(p.organization, QRE), " · ", p.eligibleFarmerTypes.join(", ") || "지원 대상 명시 없음")}<br />{mix(`신청 ${p.applicationStart || "?"} ~ ${p.applicationEnd || "?"} · `, highlightParts(p.supportType.join("/"), QRE))}</div>
        <SearchSnippet policy={p} QRE={QRE} />
      </div>
      <Button variant="outline" aria-pressed={isFav} aria-label={`관심 정책 ${isFav ? "해제" : "등록"}`} onClick={() => toggleFavorite(p.id)}>{isFav ? "★ 관심" : "☆ 관심"}</Button>
    </div>
    <div className="cact">
      <Button variant="soft" aria-expanded={isOpen} ref={el => { refs.openButtons.current[p.id] = el }} onClick={() => toggleOpen(p.id)}>{isOpen ? "접기" : "자세히 보기"}</Button>
      {officialUrl
        ? <Button as="a" variant="soft" href={officialUrl} target="_blank" rel="noopener noreferrer">{`${p.applicationUrl ? "공식 신청 페이지" : "공식 공고문"} ↗`}</Button>
        : <Button as="a" variant="soft" aria-disabled="true" style={{ opacity: "var(--opacity-disabled)", pointerEvents: "none" }}>공식 공고문 ↗</Button>}
    </div>
    {isOpen ? <PolicyDetail item={item} reviews={reviews} /> : null}
  </article>;
}
