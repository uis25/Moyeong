// 상단 메뉴 (로고 · 메뉴 · 정책 현황)
// 모바일(720px 이하)에서는 오른쪽 위 ☰ 버튼으로 메뉴를 오른쪽 서랍에 펼침. 정책 현황 숫자는 서랍 밖, 로고 옆에 그대로 (MobileMenu.css)
import { useEffect, useRef, useState } from "react";
import brandLogo from "../../assets/brand-logo.png";
import Icon from "../../components/Icon";
import NavStats from "./NavStats";
import useDocumentEvent from "../../hooks/useDocumentEvent";
import { NAV_ITEMS } from "../../constants/navigation";
import { useApp } from "../../app/AppContext";

const narrow = window.matchMedia && matchMedia("(max-width:720px)");

export default function NavBar() {
  const { view, goView, goConditions } = useApp();
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null), navRef = useRef(null);

  // 서랍이 열린 동안 뒤 화면 스크롤 막기 · 화면이 넓어지면 닫기
  useEffect(() => { document.documentElement.classList.toggle("navlock", open) }, [open]);
  useEffect(() => {
    if (!narrow) return;
    const f = () => { if (!narrow.matches) setOpen(false) };
    narrow.addEventListener("change", f); return () => narrow.removeEventListener("change", f);
  }, []);
  // Esc: 닫고 ☰ 버튼으로 포커스 · 포커스가 메뉴 밖으로 나가면 닫기
  useDocumentEvent("keydown", e => { if (e.key == "Escape" && open) { setOpen(false); btnRef.current.focus() } });
  useDocumentEvent("focusin", e => { if (open && !navRef.current.contains(e.target)) setOpen(false) });

  function onMenuClick(e, target) {
    e.preventDefault();
    setOpen(false);
    if (target) goView(target); else goConditions();
  }

  return <nav ref={navRef}><div className="w" onClick={e => { if (e.target.closest(".stats button")) setOpen(false) }}>
    <a className={`brand${view == "home" ? " on" : ""}`} href="#" id="navhome" aria-current={view == "home" ? "page" : undefined} aria-label="밭모영 홈"
      onClick={e => { e.preventDefault(); setOpen(false); goView("home") }}>
      <img className="brandlogo" src={brandLogo} alt="밭모영" width="100" height="36" />
    </a>
    <button type="button" ref={btnRef} className="navbtn" aria-expanded={open} aria-controls="navmenu" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} size={24} /></button>
    <div className={`navdim${open ? " open" : ""}`} aria-hidden="true" onClick={() => setOpen(false)} />
    <div className={`navmenu${open ? " open" : ""}`} id="navmenu">
    {NAV_ITEMS.map(([id, , label, target]) => {
      const on = target == view;
      return <a key={id} href={target ? "#" : "#top-panel"} id={id} className={on ? "on" : undefined} aria-current={on ? "page" : undefined} onClick={e => onMenuClick(e, target)}>{label}</a>;
    })}
    </div>
    <NavStats />
  </div></nav>;
}
