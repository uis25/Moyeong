// 홈: '무엇을 할 수 있나요' 메뉴 목록
import CHP from "../../assets/character-pointing.png";
import Icon from "../../components/Icon";
import { HOME_MENU } from "../../constants/navigation";
import { useApp } from "../../app/AppContext";

export default function MenuSection() {
  const { goTarget } = useApp();
  return <section className="hsec hs-menu" aria-labelledby="menu-t">
    <h2 id="menu-t">무엇을 할 수 있나요</h2>
    <p className="hint">필요한 메뉴를 누르면 바로 이동합니다.</p>
    <div className="scw" aria-hidden="true"><img className="sc sc-p" src={CHP} alt="" /></div>
    <div className="mgrid">{HOME_MENU.map(([key, title, desc]) =>
      <button key={key} className="mitem" onClick={e => { e.preventDefault(); goTarget(key) }}><span className="ico"><Icon name={key} /></span><span><b>{title}</b><span>{desc}</span></span></button>)}
    </div>
  </section>;
}
