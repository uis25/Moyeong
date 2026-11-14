// 메인 홈 화면
import HowToSection from "./HowToSection";
import MenuSection from "./MenuSection";
import NowSection from "./NowSection";
import GoalSection from "./GoalSection";
import { useApp } from "../../app/AppContext";

export default function HomeView() {
  const { view } = useApp();
  return <div id="homeview" className="home" style={{ display: view == "home" ? "" : "none" }}>
    <HowToSection />
    <MenuSection />
    <NowSection />
    <GoalSection />
  </div>;
}
