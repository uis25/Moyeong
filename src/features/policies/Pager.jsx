// 정책 목록 쪽 번호
import { pageNumbers } from "../../utils/policyList";
import { useApp } from "../../app/AppContext";

export default function Pager() {
  const { view, page, totalPages: tp, changePage } = useApp();
  const go = (n, disabled) => { if (!disabled) changePage(n) };
  const items = [];
  if (tp > 1) {
    items.push(<button key="prev" data-page={page - 1} aria-disabled={page == 1} aria-label="이전 페이지" onClick={() => go(page - 1, page == 1)}>‹<span className="pt"> 이전</span></button>);
    let prev = 0;
    for (const n of pageNumbers(page, tp)) {
      if (n - prev > 1) items.push(<span key={"g" + n} className="gap" aria-hidden="true">…</span>);
      items.push(<button key={n} data-page={n} aria-current={n == page ? "page" : undefined} aria-label={`${n}페이지`} onClick={() => go(n, false)}>{n}</button>);
      prev = n;
    }
    items.push(<button key="next" data-page={page + 1} aria-disabled={page == tp} aria-label="다음 페이지" onClick={() => go(page + 1, page == tp)}><span className="pt">다음 </span>›</button>);
  }
  return <div className="pager" id="pager" role="navigation" aria-label="정책 목록 페이지" hidden={tp <= 1} style={{ display: view == "list" ? "" : "none" }}>{items}</div>;
}
