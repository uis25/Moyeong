// 카드 제목에 검색어가 없을 때, 검색어가 들어 있는 문장 일부를 보여 줌
import { findSnippet } from "../../utils/search";
import { mix, highlightParts } from "../../utils/text";

export default function SearchSnippet({ policy, QRE }) {
  const sn = findSnippet(policy, QRE);
  if (!sn) return null;
  return <div className="qsnip"><span className="k">검색어 일치</span>{mix(sn.before ? "…" : "", highlightParts(sn.text, QRE), sn.after ? "…" : "")}</div>;
}
