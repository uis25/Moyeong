// 결과가 없을 때 가운데 정렬 안내 문구. 스타일: EmptyState.css
export default function EmptyState({ children }) {
  return <div className="empty">{children}</div>;
}
