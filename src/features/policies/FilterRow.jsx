// 내 조건 패널의 칩 한 줄 (카테고리 · 모집 상태)
import Chip from "../../components/Chip";

export default function FilterRow({ id, label, options, selected, onToggle, chipsRef }) {
  return <div className="frow">
    <span className="flab" id={`${id}-l`}>{label}</span>
    <div className="chips" id={id} role="group" aria-labelledby={`${id}-l`} ref={chipsRef}>
      {options.map(x => <Chip key={x} pressed={selected.includes(x)} onClick={() => onToggle(x)}>{x}</Chip>)}
    </div>
  </div>;
}
