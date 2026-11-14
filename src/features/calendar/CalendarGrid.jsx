// 한 달 달력 (요일 머리 · 1일 앞 빈칸 · 날짜 칸)
import CalendarDay from "./CalendarDay";
import { TODAY, pad2, ymd } from "../../utils/date";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function CalendarGrid({ cal, prefix, starts, ends }) {
  const first = new Date(cal.year, cal.month, 1).getDay(), days = new Date(cal.year, cal.month + 1, 0).getDate(), today = ymd(TODAY);
  const cells = WEEKDAYS.map(d => <div className="dow" aria-hidden="true" key={"w" + d}>{d}</div>);
  for (let i = 0; i < first; i++) cells.push(<div key={"b" + i}></div>);
  for (let d = 1; d <= days; d++) {
    const date = prefix + "-" + pad2(d);
    cells.push(<CalendarDay key={date} date={date} day={d} col={(first + d - 1) % 7} isToday={date == today} starts={starts[date]} ends={ends[date]} cal={cal} />);
  }
  return <div className="cal">{cells}</div>;
}
