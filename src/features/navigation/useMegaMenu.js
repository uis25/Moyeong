import { useRef, useState } from "react";
import useDocumentEvent from "../../hooks/useDocumentEvent";

/**
 * 상단 메뉴에 마우스를 올리면 보이는 안내판(메가 메뉴) 상태.
 * - 메뉴 밖으로 나가면 0.18초 뒤 닫힘, 다시 들어오면 취소
 * - Esc: 닫고 해당 메뉴 링크로 포커스
 * - 메뉴 밖으로 포커스가 나가면 즉시 닫힘
 */
export default function useMegaMenu() {
  const [megaKey, setMegaKey] = useState(null);
  const keyRef = useRef(null), timer = useRef(null);
  const navRef = useRef(null), linkRefs = useRef({});

  function showMega(k) { clearTimeout(timer.current); if (keyRef.current === k) return; keyRef.current = k; setMegaKey(k) }
  function hideMega(now) {
    clearTimeout(timer.current);
    const close = () => { keyRef.current = null; setMegaKey(null) };
    now ? close() : timer.current = setTimeout(close, 180);
  }
  const cancelHide = () => clearTimeout(timer.current);

  useDocumentEvent("keydown", e => {
    if (e.key == "Escape" && keyRef.current) { const a = linkRefs.current[keyRef.current]; hideMega(true); if (a) a.focus() }
  });
  useDocumentEvent("focusin", e => { if (keyRef.current && !navRef.current.contains(e.target)) hideMega(true) });

  return { megaKey, showMega, hideMega, cancelHide, navRef, linkRefs };
}
