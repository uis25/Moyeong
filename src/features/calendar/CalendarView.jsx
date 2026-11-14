// 신청 달력 화면. 다른 화면에 다녀와도 달력 상태가 유지되도록 항상 마운트해 두고, 달력 화면일 때만 내용을 그립니다.
import Panel from "../../components/Panel";
import CalendarBody from "./CalendarBody";
import useCalendar from "./useCalendar";
import { pad2 } from "../../utils/date";
import { useApp } from "../../app/AppContext";

export default function CalendarView() {
  const { policies, view } = useApp();
  const cal = useCalendar();
  const prefix = cal.year + "-" + pad2(cal.month + 1);
  // 달력을 그릴 때 다른 달의 날짜가 선택돼 있으면 해제 (원본 renderCal과 같은 시점, 렌더 중 setState 패턴)
  if (view == "cal" && cal.selected && !cal.selected.startsWith(prefix)) cal.setSelected(null);
  return <Panel id="calview" hidden={view != "cal"} aria-label="신청 달력">{view == "cal" ? <CalendarBody cal={cal} policies={policies} prefix={prefix} /> : null}</Panel>;
}
