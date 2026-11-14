// 상단 메뉴 (로고 · 메뉴 · 정책 현황 · 메뉴 안내판)
import brandLogo from "../../assets/brand-logo.png";
import NavStats from "./NavStats";
import MegaMenu from "./MegaMenu";
import { NAV_ITEMS } from "../../constants/navigation";
import { useApp } from "../../app/AppContext";

const canHover = window.matchMedia && matchMedia("(hover:hover)").matches;

export default function NavBar() {
  const { view, mega, goView, goConditions } = useApp();
  const { megaKey, showMega, hideMega, cancelHide, navRef, linkRefs } = mega;
  const hover = k => { if (canHover) showMega(k) };

  function onMenuClick(e, target) {
    e.preventDefault();
    if (target) goView(target); else goConditions();
    hideMega(true);
  }

  return <nav ref={navRef} onMouseLeave={() => hideMega()} onMouseEnter={cancelHide}><div className="w">
    <a className={`brand${view == "home" ? " on" : ""}`} href="#" id="navhome" aria-current={view == "home" ? "page" : undefined} aria-label="밭모영 홈"
      onClick={e => { e.preventDefault(); goView("home") }} onMouseEnter={() => hideMega(true)} onFocus={() => hideMega(true)}>
      <img className="brandlogo" src={brandLogo} alt="밭모영" width="100" height="36" />
    </a>
    {NAV_ITEMS.map(([id, k, label, target]) => {
      const on = target == view;
      return <a key={id} href={target ? "#" : "#top-panel"} id={id} className={on ? "on" : undefined} aria-current={on ? "page" : undefined} aria-haspopup="true" aria-expanded={megaKey == k}
        ref={el => { linkRefs.current[k] = el }} onClick={e => onMenuClick(e, target)} onMouseEnter={() => hover(k)} onFocus={() => hover(k)}>{label}</a>;
    })}
    <NavStats />
  </div>
    <MegaMenu />
  </nav>;
}
