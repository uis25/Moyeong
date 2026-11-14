// 눌림 상태가 있는 둥근 선택 버튼 (필터·별점·키워드·신청 기록). 스타일: Chip.css
export default function Chip({ pressed, ...props }) {
  return <button className="chip" aria-pressed={pressed} {...props} />;
}
