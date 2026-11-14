// 배지 + 정책명 링크 한 줄 (달력 일정·마감일 미정 목록). 정책명을 누르면 목록에서 해당 정책을 펼칩니다. 스타일: PolicyRow.css
import Badge from "./Badge";
import Button from "./Button";
import { useApp } from "../app/AppContext";

export default function PolicyRow({ policy, badge, badgeVariant }) {
  const { openPolicy } = useApp();
  return <div className="alr"><Badge variant={badgeVariant}>{badge}</Badge><Button variant="link" onClick={() => openPolicy(policy.id)}>{policy.title}</Button></div>;
}
