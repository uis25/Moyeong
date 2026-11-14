// 날짜를 누르면 열리는 그날 일정 팝업. col: 요일 칸(0~6) — 양 끝 칸이면 팝업을 안쪽으로 붙임
import PolicyRow from "../../components/PolicyRow";

export default function CalendarPopover({ date, col, starts, ends, onClose, closeRef }) {
  const title = `${+date.slice(5, 7)}월 ${+date.slice(8)}일 일정`, md = date.slice(5).replace("-", "/");
  return <div className={`calpop ${col < 2 ? "al" : col > 4 ? "ar" : ""}`} role="dialog" aria-label={title}>
    <div className="cph"><b>{title}</b>
      <button className="cpx" aria-label="닫기" ref={closeRef} onClick={() => onClose()}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
    </div>
    {(starts || []).map(p => <PolicyRow key={"s" + p.id} policy={p} badge={`${md} 접수 시작`} badgeVariant="ok" />)}
    {(ends || []).map(p => <PolicyRow key={"e" + p.id} policy={p} badge={`${md} 마감`} badgeVariant="dd" />)}
  </div>;
}
