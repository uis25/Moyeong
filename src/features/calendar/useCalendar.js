/*
 * 신청 달력 상태: 보고 있는 달 · 선택한 날짜(팝업) · 마감일 미정 목록 모두 보기.
 * 다른 화면에 다녀와도 유지됩니다 (원본과 같은 동작).
 */
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import useDocumentEvent from "../../hooks/useDocumentEvent";
import { TODAY } from "../../utils/date";
import { useApp } from "../../app/AppContext";

export default function useCalendar() {
  const { view } = useApp();
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [selected, setSelected] = useState(null);   // 팝업을 연 날짜 "YYYY-MM-DD"
  const [showAll, setShowAll] = useState(false);
  const dayRefs = useRef({}), closeRef = useRef(null);

  function moveMonth(delta) { const d = new Date(year, month + delta, 1); setYear(d.getFullYear()); setMonth(d.getMonth()); setSelected(null) }
  /** 날짜를 누르면 팝업을 열고 닫기 버튼으로, 다시 누르면 닫고 그 날짜로 포커스 */
  function toggleDay(k) {
    const next = selected == k ? null : k;
    flushSync(() => setSelected(next));
    const f = next ? closeRef.current : dayRefs.current[k]; if (f) f.focus({ preventScroll: true });
  }
  /** 팝업 닫기 (포커스는 그 날짜로) */
  function close(opts = { preventScroll: true }) {
    const k = selected; flushSync(() => setSelected(null));
    const b = dayRefs.current[k]; if (b) b.focus(opts);
  }

  /* 팝업 바깥을 누르면 닫기. 원본에서 이 리스너보다 먼저 실행돼 화면을 바꾸던 버튼(#herocta, [data-sortgo], #navcond, #navfav)은
     누른 시점에 이미 달력 화면이 아니게 되어 팝업이 닫히지 않았으므로 똑같이 제외합니다. */
  useDocumentEvent("click", e => {
    if (view == "cal" && selected && !e.target.closest(".calpop,[data-calday],[data-calnav]") && !e.target.closest("#herocta,[data-sortgo],#navcond,#navfav")) setSelected(null);
  }, true);
  useDocumentEvent("keydown", e => { if (e.key == "Escape" && view == "cal" && selected) close({}) });

  return { year, month, selected, setSelected, showAll, setShowAll, moveMonth, toggleDay, close, dayRefs, closeRef };
}
