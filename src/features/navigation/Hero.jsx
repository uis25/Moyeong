// 상단 제목 영역 (캐릭터 · 제목 · 홈 화면 CTA 버튼)
// 홈은 서비스 소개 문구, 다른 화면은 지금 있는 메뉴 이름과 설명 (메뉴 안내판과 같은 문구)
import heroCharacter from "../../assets/hero-character.png";
import Button from "../../components/Button";
import { MEGA_MENU } from "../../constants/navigation";
import { useApp } from "../../app/AppContext";

export default function Hero() {
  const { view, heroCta } = useApp();
  const page = view != "home" && MEGA_MENU[view];
  return <header className="hero"><div className="w">
    <img className="herochar" src={heroCharacter} alt="밀짚모자를 쓰고 손을 흔드는 밭모영 캐릭터" width="180" />
    {page
      ? <><h1 className="pageh">{page[0]}</h1><p className="herosub">{page[1]}</p></>
      : <h1>제주 청년농 지원사업,<br />내 상황에 맞는 것만 <span className="tang">딱!</span></h1>}
    <Button className="herocta" id="herocta" onClick={e => { e.preventDefault(); heroCta() }}>나에게 맞는 정책 모아보기<span className="arr" aria-hidden="true">→</span></Button>
  </div></header>;
}
