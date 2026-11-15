// 정책 카드의 '자세히 보기' 내용 (자격 · 내 조건 비교 · 서류 · 후기 · 신청 기록 · 링크)
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

export default function PolicyDetail({ item, reviews }) {
  const { QRE } = useApp();
  const p = item.p;
  return <div className="ex">
    {/* 요약: 공고의 목적·개요 문장을 원문 그대로. 없으면 안내 문구 */}
    {p.description ? <p style={{ margin: 0 }}>{highlight(p.description, QRE)}</p> : <p className="meta" style={{ margin: 0 }}>{EMPTY_MESSAGES.summary}</p>}
    {/* 주요 내용: 기간·지원·접수·문의 등 공고 항목을 원문 그대로 한 줄씩 */}
    <h4>주요 내용</h4>
    {(p.details || []).length ? <ul>{p.details.map((t, i) => <li key={i}>{highlight(t, QRE)}</li>)}</ul> : <div className="meta">{EMPTY_MESSAGES.details}</div>}
    {/* 주요 내용을 일부만 옮긴 정책: 공고문·첨부 확인 안내 */}
    {p.detailsMore ? <div className="meta">{EMPTY_MESSAGES.detailsMore}</div> : null}
    <div className="ex2">
      <div className="exc"><h4>신청 대상 및 자격</h4>
        {p.eligibilityDetails.length ? <ul>{p.eligibilityDetails.map((t, i) => <li key={i}>{highlight(t, QRE)}</li>)}</ul> : <div className="meta">{EMPTY_MESSAGES.eligibility}</div>}
      </div>
      <div className="exc"><h4>내 조건과 비교 <span className="meta">(참고용)</span></h4>
        <table className="cmp"><tbody>{item.e.checks.map(([name, result]) => <tr key={name}><td>{name}</td><td><Badge variant={ELIGIBILITY_LABELS[result][1]}>{CHECK_LABELS[result]}</Badge></td></tr>)}</tbody></table>
        <div className="note">{`정책 기준: 연령 ${p.ageText || range(p.minAge, p.maxAge, "세")} · 영농경력 ${range(p.minFarmingYears, p.maxFarmingYears, "년")} · 지역 ${p.eligibleRegions.join(", ") || "명시 없음"} · 농업경영체 등록 ${p.requiresBusinessRegistration == null ? "명시 없음" : p.requiresBusinessRegistration ? "필요" : "불필요"}. 이 비교는 공식 자격 심사가 아니며, 다른 필수 자격이 있을 수 있습니다.`}</div>
      </div>
    </div>
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
  </div>;
}
