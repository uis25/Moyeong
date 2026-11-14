// 후기 한 개
import Badge from "../../components/Badge";
import Tag from "../../components/Tag";
import { stars } from "../../utils/reviewStats";

export default function ReviewItem({ review: r, mine }) {
  return <div className="rvi">
    <span className="st" role="img" aria-label={`별점 ${r.rating}점`}>{stars(r.rating)}</span>{" "}
    <span className="meta">{r.createdAt + (r.updatedAt != r.createdAt ? " (수정 " + r.updatedAt + ")" : "")}</span>
    {mine ? <>{" "}<Badge variant="ok">내 후기</Badge></> : null}
    <div className="chips" style={{ marginTop: 8 }}>{r.keywords.map(k => <Tag key={k}>{k}</Tag>)}</div>
    <p>{r.content}</p>
  </div>;
}
