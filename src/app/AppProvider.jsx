/*
 * 여러 기능이 함께 쓰는 상태와 동작.
 * 원본은 전역 변수 + render()로 화면 전체를 다시 그렸습니다. 여기서는 그 전역 상태를 React state로 두고,
 * 원본에서 render()가 불리던 순서(상태 변경 → 화면 반영 → 스크롤/포커스)를 flushSync로 똑같이 맞춥니다.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AppContext } from "./AppContext";
import useMegaMenu from "../features/navigation/useMegaMenu";
import { EMPTY_CONDITIONS, PAGE_SIZE } from "../constants/conditions";
import { status } from "../utils/policyStatus";
import { toProfile, hasProfile } from "../utils/eligibility";
import { buildQuery } from "../utils/search";
import { buildPolicyList } from "../utils/policyList";
import { saveConditions } from "../services/conditionsService";
import { saveFavorite, removeFavorite } from "../services/favoritesService";
import { saveDocumentCheck } from "../services/documentsService";
import { saveRecord, removeRecord } from "../services/recordsService";

export default function AppProvider({ initial, children }) {
  const { policies, userId } = initial;
  const [conditions, setConditions] = useState(initial.conditions);
  const [favorites, setFavorites] = useState(initial.favorites);
  const [documents, setDocuments] = useState(initial.documents);
  const [records, setRecords] = useState(initial.records);
  const [view, setView] = useState("home");             // home · list · cal · fav · rec
  const [openId, setOpenId] = useState(null);           // 상세를 펼친 정책 id
  const [page, setPage] = useState(1);
  const [jump, setJump] = useState(false);              // 다음 렌더에서 펼친 정책이 있는 쪽으로 이동
  const [queryInput, setQueryInput] = useState("");     // 검색창에 입력 중인 글자
  const [query, setQuery] = useState("");               // 확정된 검색어 (Enter·버튼)
  const [sort, setSort] = useState("fit");
  const [hideMismatch, setHideMismatch] = useState(() => hasProfile(initial.conditions));
  const [hideClosed, setHideClosed] = useState(false);
  /* 원본은 render()마다 목록 innerHTML을 새로 만들어 열린 상세(.ex)의 등장 애니메이션이 다시 재생됐습니다.
     같은 효과를 내기 위해 render()가 불리던 시점마다 tick을 올리고 상세 영역의 key로 씁니다. */
  const [tick, setTick] = useState(0);
  const bump = () => setTick(t => t + 1);
  const mega = useMegaMenu();

  // 스크롤·포커스 이동 대상
  const refs = {
    bar: useRef(null), topPanel: useRef(null), srcs: useRef(null), age: useRef(null), q: useRef(null), cats: useRef(null), sts: useRef(null),
    cards: useRef({}), openButtons: useRef({}),
  };

  /* ---- 목록 계산 ---- */
  const { QX, QRE } = buildQuery(query);
  const list = buildPolicyList(policies, { profile: toProfile(conditions), conditions, QX, hide: hideMismatch, hideEnd: hideClosed, sort });
  // 쪽 번호 보정: 원본처럼 보정된 값을 그대로 유지합니다 (렌더 중 setState 패턴)
  let currentPage = page;
  if (jump && openId) { const i = list.findIndex(x => x.p.id == openId); if (i >= 0) currentPage = Math.floor(i / PAGE_SIZE) + 1 }
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages; if (currentPage < 1) currentPage = 1;
  if (currentPage !== page) setPage(currentPage);
  if (jump && openId) setJump(false);
  const statuses = policies.map(status);

  /* ---- 화면 전환 ---- */
  useLayoutEffect(() => { document.body.dataset.view = view }, [view]);
  useLayoutEffect(() => { window.scrollTo({ top: 0 }) }, []);
  /** 화면 전환: 상태를 즉시 반영한 뒤, 목록이 아니면 맨 위로 (원본 setView와 같은 순서) */
  function goView(v, extra) {
    flushSync(() => { setView(v); extra && extra() });
    if (v != "list") window.scrollTo({ top: 0 });
  }
  const scrollToListTop = () => { if (refs.bar.current) refs.bar.current.scrollIntoView({ behavior: "smooth", block: "start" }) };
  const scrollTo = (el, focus) => { el.scrollIntoView({ behavior: "smooth" }); if (focus) focus.focus({ preventScroll: true }) };

  /* ---- 검색 ---- */
  /** 검색어 확정 (Enter·검색 버튼·자동완성 선택) */
  function search(value) {
    flushSync(() => { setQueryInput(value); setQuery(value.trim()); setPage(1); if (view != "list") setView("list"); bump() });
    scrollToListTop();
  }
  /** 검색창 입력 (확정 전). 다 지우면 확정된 검색어도 지움 */
  function changeQueryInput(v) { setQueryInput(v); if (!v.trim() && query) setQuery(""); setPage(1); bump() }
  async function clearQuery() { setPage(1); setQueryInput(""); setQuery(""); bump(); await saveConditions(conditions) }

  /* ---- 내 조건 ---- */
  async function updateConditions(next, { syncHide = false } = {}) {
    setPage(1); setConditions(next); if (syncHide) setHideMismatch(hasProfile(next)); bump();
    await saveConditions(next);
  }
  const changeCondition = (field, value) => updateConditions({ ...conditions, [field]: value }, { syncHide: true });
  const toggleFilter = (key, v) => { const a = conditions[key]; return updateConditions({ ...conditions, [key]: a.includes(v) ? a.filter(i => i != v) : [...a, v] }) };
  /** 조건 태그 삭제 ("age" 또는 "cats:농지" 형식) */
  function removeTag(tag) {
    if (tag.includes(":")) { const [k, v] = tag.split(":"); return updateConditions({ ...conditions, [k]: conditions[k].filter(i => i != v) }, { syncHide: true }) }
    return updateConditions({ ...conditions, [tag]: "" }, { syncHide: true });
  }
  async function resetAll() {
    const next = { ...EMPTY_CONDITIONS, cats: [], sts: [] };
    setPage(1); setConditions(next); setQueryInput(""); setQuery(""); setHideMismatch(false); bump();
    await saveConditions(next);
  }

  /* ---- 목록 보기 옵션 ---- */
  const changeSort = v => { setSort(v); setPage(1); bump() };
  const changeHideMismatch = v => { setHideMismatch(v); setPage(1); bump() };
  const changeHideClosed = v => { setHideClosed(v); setPage(1); bump() };
  function changePage(n) { flushSync(() => { setPage(n); bump() }); scrollToListTop() }

  /* ---- 정책별 저장 데이터 ---- */
  async function toggleOpen(id) { setOpenId(o => o == id ? null : id); bump(); await saveConditions(conditions) }
  async function toggleFavorite(id) {
    const on = favorites.includes(id);
    setFavorites(on ? favorites.filter(x => x != id) : [...favorites, id]); bump();
    await (on ? removeFavorite(id) : saveFavorite(id)); await saveConditions(conditions);
  }
  /** 같은 상태를 다시 누르면 기록 삭제 */
  async function toggleRecord(id, value) {
    const remove = records[id] == value, next = { ...records };
    if (remove) delete next[id]; else next[id] = value;
    setRecords(next); bump();
    await (remove ? removeRecord(id) : saveRecord(id, value));
  }
  async function toggleDocument(id, index, checked) {
    setDocuments(d => ({ ...d, [id + ":" + index]: checked }));
    await saveDocumentCheck(id, index, checked);
  }

  /* ---- 화면 이동 ---- */
  /** 홈 '나에게 맞는 정책 모아보기' 버튼 */
  function heroCta() { goView("list", () => { setSort("fit"); setPage(1); bump() }); window.scrollTo({ top: 0, behavior: "smooth" }) }
  /** 상단 숫자(모집 중·마감 임박) · 홈 '전체 정책 모아보기': 목록으로 가서 정렬 변경 */
  function sortGo(v) {
    mega.hideMega(true);
    flushSync(() => { if (view != "list") setView("list"); if (v) setSort(v); setPage(1); bump() });
    scrollToListTop();
  }
  /** 내 조건 설정으로 이동 */
  function goConditions() { if (view != "list") goView("list"); scrollTo(refs.topPanel.current, refs.age.current) }
  /** 홈 메뉴·상단 숫자에서 이동 (cond·srcs는 목록의 해당 영역으로) */
  function goTarget(g) {
    if (g == "cond" || g == "srcs") { goView("list"); scrollTo((g == "cond" ? refs.topPanel : refs.srcs).current, g == "cond" ? refs.age.current : null) }
    else goView(g);
  }
  /** 정책명을 누르면 목록으로 가서 필터를 풀고 해당 카드를 펼침 */
  async function openPolicy(id) {
    const next = { ...conditions, cats: [], sts: [] };
    goView("list", () => { setOpenId(id); setJump(true); setConditions(next); setQueryInput(""); setQuery(""); setHideMismatch(false); setHideClosed(false); bump() });
    const card = refs.cards.current[id];
    if (card) { card.scrollIntoView({ behavior: "smooth", block: "start" }); const b = refs.openButtons.current[id]; if (b) b.focus({ preventScroll: true }) }
    await saveConditions(next);
  }
  /** 메뉴 안내판의 '바로 가기' */
  function megaGo(g) {
    mega.hideMega(true);
    if (["cal", "rec", "fav"].includes(g)) { goView(g); return }
    goView("list");
    if (g == "list") { window.scrollTo({ top: 0, behavior: "smooth" }); return }
    if (g == "due") { flushSync(() => { setSort("due"); setPage(1); bump() }); refs.bar.current.scrollIntoView({ behavior: "smooth" }) }
    else if (g == "q") refs.q.current.focus();
    else scrollTo(g == "srcs" ? refs.srcs.current : refs.topPanel.current, g == "cats" ? refs.cats.current.querySelector("button") : g == "sts" ? refs.sts.current.querySelector("button") : g == "cond" ? refs.age.current : null);
  }

  const value = {
    policies, userId, initialReviews: initial.reviews, conditions, favorites, documents, records, view, openId, queryInput, query, sort, hideMismatch, hideClosed, tick,
    QX, QRE, list, page: currentPage, totalPages, statuses, refs, mega,
    bump, goView, scrollToListTop, search, changeQueryInput, clearQuery,
    changeCondition, toggleFilter, removeTag, resetAll, changeSort, changeHideMismatch, changeHideClosed, changePage,
    toggleOpen, toggleFavorite, toggleRecord, toggleDocument,
    heroCta, sortGo, goConditions, goTarget, openPolicy, megaGo,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
