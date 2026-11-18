// 이름표 + 선택 상자 (영농 지역 · 영농경력 · 농업경영체 등록). options: [[값, 이름], ...] · onChange(값)
import Select from "../../components/Select";

export default function SelectField({ id, label, value, options, onChange }) {
  return <div>
    <label htmlFor={`${id}-btn`} id={`${id}-l`}>{label}</label>
    <Select id={id} labelledBy={`${id}-l`} value={value} options={[["", "선택 안 함"], ...options]} onChange={onChange} />
  </div>;
}
