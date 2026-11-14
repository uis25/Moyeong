/*
 * 선배 후기 데이터 + 정책별 후기 화면 상태(펼침·필터·정렬·작성 중 내용).
 * 화면 상태는 카드를 접었다 펴거나 쪽을 옮겨도 유지되도록 정책 id별로 보관합니다 (원본과 같은 동작).
 */
import { useState } from "react";
import { useApp } from "../../app/AppContext";
import { REVIEWS_PER_PAGE } from "../../constants/reviews";
import { ymd } from "../../utils/date";
import { saveReview, removeReview } from "../../services/reviewsService";

const UI_DEFAULT = { open: false, fs: 0, fk: "", sort: "new", n: REVIEWS_PER_PAGE, star: 0, kw: [], draft: "", write: false, msg: "", busy: false };

export default function useReviews() {
  const { userId, initialReviews } = useApp();
  const [reviews, setReviews] = useState(initialReviews);
  const [ui, setUi] = useState({});

  const uiOf = pid => ui[pid] || UI_DEFAULT;
  const reviewsOf = pid => reviews.filter(r => r.policyId == pid);

  /**
   * 후기 영역 동작. a: open(펼치기) · write(작성 열기/취소) · fs(별점 필터) · fk(키워드 필터) · sort · more(더 보기)
   *                     · star(별점 선택) · kw(키워드 선택, 최대 3개) · submit(등록) · del(내 후기 삭제)
   */
  async function act(a, pid, v) {
    const s = { ...uiOf(pid), msg: "" };
    let next = null, save = null;
    if (a == "open") s.open = !s.open;
    else if (a == "write") {
      s.write = !s.write;
      const mine = reviewsOf(pid).find(r => r.authorId == userId);
      if (s.write && mine && !s.draft) { s.star = mine.rating; s.kw = [...mine.keywords]; s.draft = mine.content }
    }
    else if (a == "fs") { s.fs = +v; s.n = REVIEWS_PER_PAGE }
    else if (a == "fk") { s.fk = s.fk == v ? "" : v; s.n = REVIEWS_PER_PAGE }
    else if (a == "sort") { s.sort = v; s.n = REVIEWS_PER_PAGE }
    else if (a == "more") s.n += REVIEWS_PER_PAGE;
    else if (a == "star") s.star = +v;
    else if (a == "kw") s.kw = s.kw.includes(v) ? s.kw.filter(k => k != v) : s.kw.length < 3 ? [...s.kw, v] : s.kw;
    else if (a == "submit") {
      const content = s.draft.trim();
      if (!s.star || content.length < 5) s.msg = "별점과 5자 이상의 후기를 입력해 주십시오.";
      else {
        const d = ymd(new Date()), ex = reviews.find(r => r.policyId == pid && r.authorId == userId);
        const fields = { rating: s.star, keywords: s.kw, content, createdAt: ex ? ex.createdAt : d, updatedAt: d };
        const review = ex ? { ...ex, ...fields } : { id: "r" + Date.now(), policyId: pid, authorId: userId, ...fields };
        next = ex ? reviews.map(r => r === ex ? review : r) : [...reviews, review];
        save = () => saveReview(review);
        Object.assign(s, { write: false, star: 0, kw: [], draft: "", open: true, fs: 0, fk: "", sort: "new", n: REVIEWS_PER_PAGE, msg: ex ? "후기가 수정되었습니다. 통계와 요약이 갱신되었습니다." : "후기가 등록되었습니다. 통계와 요약이 갱신되었습니다." });
      }
    }
    else if (a == "del") {
      next = reviews.filter(r => !(r.policyId == pid && r.authorId == userId));
      save = () => removeReview(pid, userId);
      s.msg = "후기를 삭제했습니다.";
    }
    if (next) setReviews(next);
    setUi(m => ({ ...m, [pid]: s }));
    if (save) await save();
  }

  /** 작성 중인 후기 글 (화면을 다시 그리지 않는 원본과 달리 입력값을 state로 보관) */
  const setDraft = (pid, v) => setUi(m => ({ ...m, [pid]: { ...(m[pid] || UI_DEFAULT), draft: v } }));

  return { userId, uiOf, reviewsOf, act, setDraft };
}
