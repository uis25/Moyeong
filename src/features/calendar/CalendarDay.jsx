// 달력의 날짜 한 칸. 일정이 있으면 누를 수 있는 버튼(+팝업), 없으면 그냥 칸
import CalendarPopover from "./CalendarPopover";
import { shortCategory } from "../../utils/policyStatus";

export default function CalendarDay({ date, day, col, isToday, starts, ends, cal }) {
  const label = `${+date.slice(5, 7)}월 ${day}일${ends ? " 마감 " + ends.length + "건" : ""}${starts ? " 접수 시작 " + starts.length + "건" : ""}`;
  const className = `day${isToday ? " today" : ""}`;
  const inner = <>
    <span className="dn">{day}</span>
    {(starts || []).map(p => <span className="cnt s" key={"s" + p.id}>{shortCategory(p)}</span>)}
    {(ends || []).map(p => <span className="cnt" key={"e" + p.id}>{shortCategory(p)}</span>)}
  </>;
  if (!starts && !ends) return <div className={className} aria-label={label}>{inner}</div>;
  const open = cal.selected == date;
  return <div className="dcell" style={{ "--c": col }}>
    <button className={className} data-calday={date} aria-pressed={open} aria-expanded={open} aria-haspopup="dialog" aria-label={label}
      ref={el => { cal.dayRefs.current[date] = el }} onClick={() => cal.toggleDay(date)}>{inner}</button>
    {open ? <CalendarPopover date={date} col={col} starts={starts} ends={ends} onClose={cal.close} closeRef={cal.closeRef} /> : null}
  </div>;
}
