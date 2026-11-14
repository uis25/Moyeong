// 정책 카드 (제목 · 기관 · 관심 버튼 · 자세히 보기). 원본에 있던 맨 위 판정·상태 배지는 제거함 (docs/differences.md)
import Button from "../../components/Button";
import SearchSnippet from "./SearchSnippet";
import PolicyDetail from "./PolicyDetail";
import { mix, highlight, highlightParts } from "../../utils/text";
import { useApp } from "../../app/AppContext";

export default function PolicyCard({ item, reviews }) {
  const { openId, favorites, QRE, tick, refs, toggleOpen, toggleFavorite } = useApp();
  const { p, e } = item;
  const isOpen = openId == p.id, isFav = favorites.includes(p.id);
  const officialUrl = p.applicationUrl || p.officialNoticeUrl;

  return <article className={`card${e.overall == "no" ? " dim" : ""}`} id={`card-${p.id}`} ref={el => { refs.cards.current[p.id] = el }}>
    <div className="top">
      <div>
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
        : <Button as="span" variant="soft" aria-disabled="true" style={{ opacity: .45, cursor: "default" }}>공식 링크 없음</Button>}
    </div>
    {/* key={tick}: 원본처럼 화면을 다시 그릴 때마다 상세 영역의 등장 애니메이션을 다시 재생 */}
    {isOpen ? <PolicyDetail key={tick} item={item} reviews={reviews} /> : null}
  </article>;
}
