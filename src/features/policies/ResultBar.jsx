// 목록 위 막대 (검색 결과 수 · 정렬 · 숨기기 옵션)
import { SORT_OPTIONS } from "../../constants/conditions";
import { useApp } from "../../app/AppContext";

export default function ResultBar() {
  const { view, list, sort, hideMismatch, hideClosed, refs, changeSort, changeHideMismatch, changeHideClosed } = useApp();
  const options = [["hide", "조건 불일치 숨기기", hideMismatch, changeHideMismatch], ["hideend", "마감 정책 숨기기", hideClosed, changeHideClosed]];
  return <div className="bar" ref={refs.bar} style={{ display: view == "list" ? "" : "none" }}>
    <strong id="cnt">{`검색 결과 ${list.length}건`}</strong>
    <div>
      <label className="sl">정렬 <select id="sort" value={sort} onChange={e => changeSort(e.target.value)}>{SORT_OPTIONS.map(([v, text]) => <option key={v} value={v}>{text}</option>)}</select></label>
      {options.map(([id, text, checked, onChange]) => <label className="ck" key={id}><input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} />{" " + text}</label>)}
    </div>
  </div>;
}
