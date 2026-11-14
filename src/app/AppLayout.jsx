/*
 * 전체 화면 배치. 원본과 같은 DOM 순서를 유지합니다:
 * 메뉴 → 제목 → [홈 → 검색 → 내 조건 → 달력 → 관심/기록 → 결과 막대 → 목록 → 쪽 번호 → 공식 링크 → 안내] → 사이트 정보
 * 각 영역은 현재 화면(view)에 따라 스스로 보이거나 숨습니다.
 */
import Panel from "../components/Panel";
import NavBar from "../features/navigation/NavBar";
import Hero from "../features/navigation/Hero";
import SiteFooter from "../features/navigation/SiteFooter";
import HomeView from "../features/home/HomeView";
import SearchBox from "../features/policies/SearchBox";
import ConditionsPanel from "../features/policies/ConditionsPanel";
import ResultBar from "../features/policies/ResultBar";
import PolicyList from "../features/policies/PolicyList";
import Pager from "../features/policies/Pager";
import OfficialSources from "../features/policies/OfficialSources";
import CalendarView from "../features/calendar/CalendarView";
import FavoritesView from "../features/favorites/FavoritesView";
import RecordsView from "../features/records/RecordsView";
import { useApp } from "./AppContext";

export default function AppLayout() {
  const { view } = useApp();
  return <>
    <NavBar />
    <Hero />
    <main className="w">
      <HomeView />
      <SearchBox />
      <ConditionsPanel />
      <CalendarView />
      {/* 관심 정책 · 신청 기록이 함께 쓰는 영역 */}
      <Panel id="sideview" hidden={view != "fav" && view != "rec"} aria-live="polite">
        {view == "fav" ? <FavoritesView /> : view == "rec" ? <RecordsView /> : null}
      </Panel>
      <ResultBar />
      <PolicyList />
      <Pager />
      <OfficialSources />
      <footer>⚠ 정책 정보는 공개된 공고·보도자료를 바탕으로 정리한 것이며 확인일은 카드에 표시됩니다. 신청 기간과 자격은 바뀔 수 있습니다. 조건 비교는 참고용이며 공식 자격 심사가 아닙니다. 최종 신청 자격은 반드시 공식 공고문에서 확인하시기 바랍니다.</footer>
    </main>
    <SiteFooter />
  </>;
}
