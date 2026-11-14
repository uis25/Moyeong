// 신청 기록 진행 상태 칩 4개 (같은 상태를 다시 누르면 기록 삭제)
import Chip from "../../components/Chip";
import { RECORD_STATUSES } from "../../constants/records";
import { useApp } from "../../app/AppContext";

export default function RecordChips({ policyId }) {
  const { records, toggleRecord } = useApp();
  return RECORD_STATUSES.map(s => <Chip key={s} pressed={records[policyId] == s} onClick={() => toggleRecord(policyId, s)}>{s}</Chip>);
}
