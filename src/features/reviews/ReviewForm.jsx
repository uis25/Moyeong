// 후기 작성·수정 폼 (별점 · 키워드 최대 3개 · 내용 5자 이상)
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { REVIEW_KEYWORDS } from "../../constants/reviews";

export default function ReviewForm({ policyId, ui, act, setDraft }) {
  return <div className="rvi">
    <b>별점</b>
    <div className="chips">{[1, 2, 3, 4, 5].map(n => <Chip key={n} pressed={ui.star == n} onClick={() => act("star", n)}>{`${n}점`}</Chip>)}</div>
    <div style={{ marginTop: 12 }}><b>키워드</b> <span className="meta">(최대 3개)</span></div>
    <div className="chips">{REVIEW_KEYWORDS.map(k => <Chip key={k} pressed={ui.kw.includes(k)} onClick={() => act("kw", k)}>{k}</Chip>)}</div>
    <label htmlFor={`d-${policyId}`} style={{ marginTop: 12 }}>후기 (5자 이상)</label>
    <textarea id={`d-${policyId}`} maxLength={500} value={ui.draft} onChange={e => setDraft(e.target.value)}></textarea>
    <Button disabled={ui.busy} onClick={() => act("submit")}>{ui.busy ? "저장 중…" : "후기 등록"}</Button>
  </div>;
}
