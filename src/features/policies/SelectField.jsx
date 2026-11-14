// 이름표 + 선택 상자 (영농 지역 · 영농경력 · 농업경영체 등록). options: [[값, 이름], ...]
export default function SelectField({ id, label, value, options, onChange }) {
  return <div>
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={onChange}>
      <option value="">선택 안 함</option>
      {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
    </select>
  </div>;
}
