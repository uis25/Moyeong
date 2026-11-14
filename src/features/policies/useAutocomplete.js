import { useRef, useState } from "react";
import { buildSuggestions } from "../../utils/search";

/**
 * 검색창 자동완성. 입력이 멈추고 0.25초 뒤 추천 목록(최대 5개)을 보여 줍니다.
 * markValue: 목록을 그린 시점의 입력값 (추천어에서 이 부분을 굵게 표시)
 */
export default function useAutocomplete(policies, inputValue) {
  const [ac, setAc] = useState({ items: [], index: -1, markValue: "" });
  const timer = useRef(null), input = useRef("");
  input.current = inputValue;

  function close() { clearTimeout(timer.current); setAc({ items: [], index: -1, markValue: "" }) }
  function show(items, index) { if (!items.length) { close(); return } setAc({ items, index, markValue: input.current }) }
  /** 입력이 바뀔 때: 비었으면 닫고, 아니면 0.25초 뒤 추천 */
  function schedule(v) {
    clearTimeout(timer.current);
    if (!v.trim()) close();
    else timer.current = setTimeout(() => show(buildSuggestions(v, policies), -1), 250);
  }
  /** 위·아래 화살표로 선택 이동 (처음·끝에서 반대쪽으로 순환) */
  const move = d => show(ac.items, (ac.index + d + ac.items.length) % ac.items.length);

  return { ...ac, isOpen: ac.items.length > 0, close, schedule, move };
}
