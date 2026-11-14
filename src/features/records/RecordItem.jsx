// 신청 기록 목록의 정책 한 개 (진행 상태 바꾸기 · 기록 삭제)
import Button from "../../components/Button";
import RecordChips from "./RecordChips";
import { deadlineMeta } from "../../utils/policyStatus";
import { useApp } from "../../app/AppContext";

export default function RecordItem({ policy: p, status }) {
  const { openPolicy, toggleRecord } = useApp();
  return <div className="rvi">
    <Button variant="link" onClick={() => openPolicy(p.id)}>{p.title}</Button>
    <div className="meta">{deadlineMeta(p)}</div>
    <div className="chips" role="group" aria-label="진행 상태">
      <RecordChips policyId={p.id} />
      {/* 현재 상태를 다시 누른 것과 같아서 기록이 삭제됨 */}
      <Button variant="outline" onClick={() => toggleRecord(p.id, status)}>기록 삭제</Button>
    </div>
  </div>;
}
