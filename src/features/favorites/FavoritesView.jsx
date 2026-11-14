// 관심 정책 목록 (☆로 담은 정책)
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { deadlineMeta } from "../../utils/policyStatus";
import { useApp } from "../../app/AppContext";

export default function FavoritesView() {
  const { policies, favorites, openPolicy, toggleFavorite } = useApp();
  const list = policies.filter(p => favorites.includes(p.id));
  return <>
    <h2 style={{ margin: "0 0 8px" }}>관심 정책 <span className="meta">{`${list.length}건`}</span></h2>
    {list.length ? list.map(p => <div className="alr" style={{ justifyContent: "space-between" }} key={p.id}>
      <div><Button variant="link" onClick={() => openPolicy(p.id)}>{p.title}</Button><div className="meta">{deadlineMeta(p)}</div></div>
      <Button variant="outline" aria-pressed="true" aria-label="관심 정책 해제" onClick={() => toggleFavorite(p.id)}>★ 해제</Button>
    </div>)
      : <EmptyState>관심 정책 없음<br />정책 카드의 ☆ 관심을 누르면 이곳에 모입니다.</EmptyState>}
  </>;
}
