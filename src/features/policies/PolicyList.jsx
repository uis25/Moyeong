// 정책 카드 목록 (현재 쪽). 후기 상태는 카드를 접거나 쪽을 옮겨도 유지되도록 여기서 한 번만 만듭니다.
import EmptyState from "../../components/EmptyState";
import PolicyCard from "./PolicyCard";
import useReviews from "../reviews/useReviews";
import { PAGE_SIZE } from "../../constants/conditions";
import { useApp } from "../../app/AppContext";

export default function PolicyList() {
  const { view, list, page, query } = useApp();
  const reviews = useReviews();
  return <div id="list" style={{ display: view == "list" ? "" : "none" }}>
    {list.length
      ? list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => <PolicyCard key={item.p.id} item={item} reviews={reviews} />)
      : <EmptyState><b>조건에 맞는 정책 없음</b><br />{`${query ? `'${query}' 대신 더 짧거나 일반적인 말(예: 농지, 자금, 교육)로 검색하거나 ` : ""}필터를 줄이거나 '조건 불일치 숨기기'·'마감 정책 숨기기'를 해제하십시오.`}</EmptyState>}
  </div>;
}
