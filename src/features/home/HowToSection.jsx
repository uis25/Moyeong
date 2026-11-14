// 홈: '이렇게 이용하세요' 4단계 안내
import CHG from "../../assets/character-greeting.png";
import Button from "../../components/Button";
import { HOME_STEPS } from "../../constants/navigation";
import { useApp } from "../../app/AppContext";

export default function HowToSection() {
  const { goTarget } = useApp();
  return <section className="hsec hs-how" aria-labelledby="how-t">
    <h2 id="how-t" className="hhow">이렇게 이용하세요<img className="sc-g2" src={CHG} alt="" aria-hidden="true" /></h2>
    <ol className="steps">{HOME_STEPS.map(([title, desc]) => <li key={title}><b>{title}</b><span>{desc}</span></li>)}</ol>
    <Button style={{ marginTop: 16 }} onClick={e => { e.preventDefault(); goTarget("cond") }}>내 조건 입력하고 시작하기</Button>
  </section>;
}
