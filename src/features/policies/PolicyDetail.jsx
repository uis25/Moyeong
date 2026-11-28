// 정책 카드의 '자세히 보기' 내용 (요약 · 내 조건 비교 · 서류 · 후기 · 신청 기록 · 링크)
// 주요 내용·신청 대상 및 자격 목록은 너무 길어 표시하지 않음 (데이터는 policies.json에 그대로 둠, docs/differences.md 26번)
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import DocChecklist from "./DocChecklist";
import ReviewSection from "../reviews/ReviewSection";
import RecordChips from "../records/RecordChips";
import { ELIGIBILITY_LABELS, CHECK_LABELS } from "../../constants/conditions";
import { EMPTY_MESSAGES } from "../../constants/messages";
import { highlight } from "../../utils/text";
import { useApp } from "../../app/AppContext";

const range = (a, b, unit) => a == null && b == null ? "명시 없음" : (a ?? "") + "~" + (b ?? "") + unit;

/** 공식 링크 버튼 (주소가 없으면 흐리게 비활성) */
function OfficialLink({ url, label, variant }) {
  return url
    ? <Button as="a" variant={variant} href={url} target="_blank" rel="noopener">{`${label} ↗`}</Button>
    : <Button as="a" variant={variant} aria-disabled="true" style={{ opacity: "var(--opacity-disabled)", pointerEvents: "none" }}>{`${label} ↗`}</Button>;
}

export default function PolicyDetail({ item, reviews, onFold }) {
  const { QRE } = useApp();
  const p = item.p;
  return <div className="ex">
    {/* 요약: 공고의 목적·개요 문장을 원문 그대로. 없으면 안내 문구 */}
    {p.description ? <p style={{ margin: 0 }}>{highlight(p.description, QRE)}</p> : <p className="meta" style={{ margin: 0 }}>{EMPTY_MESSAGES.summary}</p>}
    <h4>내 조건과 비교 <span className="meta">(참고용)</span></h4>
    <table className="cmp"><tbody>{item.e.checks.map(([name, result]) => <tr key={name}><td>{name}</td><td><Badge variant={ELIGIBILITY_LABELS[result][1]}>{CHECK_LABELS[result]}</Badge></td></tr>)}</tbody></table>
    <div className="note">{`정책 기준: 연령 ${p.ageText || range(p.minAge, p.maxAge, "세")} · 영농경력 ${range(p.minFarmingYears, p.maxFarmingYears, "년")} · 지역 ${p.eligibleRegions.join(", ") || "명시 없음"} · 농업경영체 등록 ${p.requiresBusinessRegistration == null ? "명시 없음" : p.requiresBusinessRegistration ? "필요" : "불필요"}. 이 비교는 공식 자격 심사가 아니며, 다른 필수 자격이 있을 수 있습니다.`}</div>
    <h4>준비 서류 체크리스트</h4>
    <DocChecklist policy={p} />
    <ReviewSection policy={p} reviews={reviews} />
    <h4>신청 기록</h4>
    <div className="chips" role="group" aria-label="신청 기록"><RecordChips policyId={p.id} /></div>
    <h4>참고 링크</h4>
    <div className="links">
      <OfficialLink url={p.applicationUrl} label="공식 신청 페이지" variant={p.applicationUrl ? "primary" : "soft"} />
      <OfficialLink url={p.officialNoticeUrl} label="공식 공고문" variant="soft" />
    </div>
    <div className="note">{p.applicationUrl || p.officialNoticeUrl ? "외부 사이트로 이동합니다." : "확인된 공식 링크가 없습니다. 아래 참고 링크나 해당 기관 사이트에서 공고를 확인해 주십시오."}</div>
    {(p.references || []).length ? <ul className="refs">{p.references.map((r, i) => <li key={i}><a href={r.url} target="_blank" rel="noopener noreferrer">{`${r.label} ↗`}</a></li>)}</ul> : null}
    <div className="note">{`출처: ${p.sourceName} · 확인일 ${p.lastVerifiedAt || "미확인"}`}</div>
    {/* 긴 상세를 다 읽은 뒤 위로 올라가지 않고 바로 접기 */}
    <div className="cfold"><Button variant="soft" aria-expanded="true" onClick={onFold}>접기</Button></div>
  </div>;
}
