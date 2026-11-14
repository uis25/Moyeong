// 메뉴에 마우스를 올리면 아래로 펼쳐지는 기능 안내판
import Icon from "../../components/Icon";
import { MEGA_MENU } from "../../constants/navigation";
import { useApp } from "../../app/AppContext";

export default function MegaMenu() {
  const { mega, megaGo } = useApp();
  const k = mega.megaKey, m = k && MEGA_MENU[k];
  return <div className="mega" id="mega" hidden={!m}>
    {m ? <div className="w">
      <button className="intro" aria-label={`${m[0]} 바로 가기`} onClick={e => { e.preventDefault(); megaGo(k) }}><span className="ico"><Icon name={k} size={32} /></span><h3>{m[0]}</h3><p>{m[1]}</p><span className="go">바로 가기 →</span></button>
      <div className="sub">{m[2].map((x, i) => <div className="si" key={i}><b>{x[1]}</b><span>{x[2]}</span></div>)}</div>
    </div> : null}
  </div>;
}
