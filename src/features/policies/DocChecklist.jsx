// 준비 서류 체크리스트 (이 기기에 저장)
import { useApp } from "../../app/AppContext";

export default function DocChecklist({ policy: p }) {
  const { documents, toggleDocument } = useApp();
  if (!p.requiredDocuments.length) return <div className="meta">확인된 서류 없음. 공식 공고를 확인하십시오.</div>;
  return <ul>{p.requiredDocuments.map((t, i) => <li className="d" key={i}>
    <label className="doc"><input type="checkbox" checked={!!documents[p.id + ":" + i]} onChange={e => toggleDocument(p.id, i, e.target.checked)} />{t}</label>
  </li>)}</ul>;
}
