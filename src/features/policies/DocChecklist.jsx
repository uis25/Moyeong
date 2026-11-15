// 준비 서류 체크리스트 (이 기기에 저장)
import { useApp } from "../../app/AppContext";
import { EMPTY_MESSAGES } from "../../constants/messages";

export default function DocChecklist({ policy: p }) {
  const { documents, toggleDocument } = useApp();
  if (!p.requiredDocuments.length) return <div className="meta">{EMPTY_MESSAGES.documents}</div>;
  return <ul>{p.requiredDocuments.map((t, i) => <li className="d" key={i}>
    <label className="doc"><input type="checkbox" checked={!!documents[p.id + ":" + i]} onChange={e => toggleDocument(p.id, i, e.target.checked)} />{t}</label>
  </li>)}</ul>;
}
