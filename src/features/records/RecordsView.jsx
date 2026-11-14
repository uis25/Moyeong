// 신청 기록 목록 (진행 상태별로 묶어서 표시)
import { Fragment } from "react";
import EmptyState from "../../components/EmptyState";
import RecordItem from "./RecordItem";
import { RECORD_STATUSES } from "../../constants/records";
import { useApp } from "../../app/AppContext";

export default function RecordsView() {
  const { policies, records } = useApp();
  const ids = Object.keys(records).filter(id => policies.some(p => p.id == id));
  return <>
    <h2 style={{ margin: "0 0 8px" }}>신청 기록 <span className="meta">{`${ids.length}건`}</span></h2>
    {ids.length ? RECORD_STATUSES.map(s => {
      const list = ids.filter(id => records[id] == s).map(id => policies.find(p => p.id == id));
      return list.length ? <Fragment key={s}>
        <h3 style={{ fontSize: 16, margin: "16px 0 4px" }}>{`${s} `}<span className="meta">{`${list.length}건`}</span></h3>
        {list.map(p => <RecordItem key={p.id} policy={p} status={s} />)}
      </Fragment> : null;
    }) : <EmptyState>신청 기록 없음<br />정책 상세의 '신청 기록'에서 진행 상태를 선택하십시오.</EmptyState>}
  </>;
}
