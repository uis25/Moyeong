// 선택 상자 (브라우저 기본 목록 대신 사이트 디자인에 맞춘 목록. 항상 상자 아래로 펼쳐짐)
// options: [[값, 이름], ...] · onChange(값) · 버튼 id는 `${id}-btn`, 감싸는 요소는 data-sel={id}
import { useState } from "react";
import useDocumentEvent from "../hooks/useDocumentEvent";

export default function Select({ id, value, options, onChange, labelledBy }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // 키보드로 고르고 있는 항목
  const sel = Math.max(0, options.findIndex(([v]) => v === value));

  const show = () => { setActive(sel); setOpen(true) };
  const pick = i => { setOpen(false); if (options[i][0] !== value) onChange(options[i][0]) };

  // 바깥을 누르면 닫기
  useDocumentEvent("pointerdown", e => { if (open && !e.target.closest(`[data-sel="${id}"]`)) setOpen(false) });

  const onKeyDown = e => {
    const last = options.length - 1;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show() }
      return;
    }
    const move = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last }[e.key];
    if (move != null) { e.preventDefault(); setActive(move) }
    else if (e.key == "Enter" || e.key == " ") { e.preventDefault(); pick(active) }
    else if (e.key == "Escape") { e.preventDefault(); setOpen(false) }
    else if (e.key == "Tab") setOpen(false);
  };

  return <div className="sel" data-sel={id}>
    <button type="button" id={`${id}-btn`} className="selbtn" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
      aria-labelledby={labelledBy ? `${labelledBy} ${id}-btn` : undefined} aria-activedescendant={open ? `${id}-o${active}` : undefined}
      onClick={() => open ? setOpen(false) : show()} onKeyDown={onKeyDown}>{options[sel][1]}</button>
    {open ? <ul className="sellist" id={`${id}-list`} role="listbox" aria-labelledby={labelledBy}>
      {options.map(([v, text], i) => <li key={v} id={`${id}-o${i}`} role="option" data-value={v} aria-selected={i === sel} className={i === active ? "on" : undefined}
        onPointerEnter={() => setActive(i)} onMouseDown={e => e.preventDefault()} onClick={() => pick(i)}>{text}</li>)}
    </ul> : null}
  </div>;
}
