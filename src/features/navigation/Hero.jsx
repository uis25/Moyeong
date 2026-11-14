// 상단 제목 영역 (캐릭터 · 제목 · 홈 화면 CTA 버튼)
import heroCharacter from "../../assets/hero-character.png";
import Button from "../../components/Button";
import { useApp } from "../../app/AppContext";

export default function Hero() {
  const { heroCta } = useApp();
  return <header className="hero"><div className="w">
    <img className="herochar" src={heroCharacter} alt="밀짚모자를 쓰고 손을 흔드는 밭모영 캐릭터" width="180" />
    <h1>제주 청년농 지원사업,<br />내 상황에 맞는 것만 <span className="tang">딱!</span></h1>
    <Button className="herocta" id="herocta" onClick={e => { e.preventDefault(); heroCta() }}>나에게 맞는 정책 모아보기<span className="arr" aria-hidden="true">→</span></Button>
  </div></header>;
}
