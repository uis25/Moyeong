// 상단 오른쪽 정책 현황 숫자 (모집 중 · 마감 임박 · 관심 정책)
import { useApp } from "../../app/AppContext";

export default function NavStats() {
  const { statuses, favorites, sortGo, goTarget } = useApp();
  const items = [
    { id: "s1", label: "모집 중", count: statuses.filter(x => x == "모집 중" || x == "마감 임박").length, title: "정책 모아보기 (최신 등록순)", sortGo: "new" },
    { id: "s2", label: "마감 임박(7일 이내)", count: statuses.filter(x => x == "마감 임박").length, title: "정책 모아보기 (마감 임박순)", sortGo: "due" },
    { id: "s3", label: "관심 정책", count: favorites.length, title: "관심 정책으로 이동" },
  ];
  return <div className="stats" aria-label="정책 현황">
    {items.map(x => <button key={x.id} type="button" data-sortgo={x.sortGo} title={x.title}
      onClick={e => { e.preventDefault(); x.sortGo ? sortGo(x.sortGo) : goTarget("fav") }}><strong id={x.id}>{x.count}</strong>{x.label}</button>)}
  </div>;
}
