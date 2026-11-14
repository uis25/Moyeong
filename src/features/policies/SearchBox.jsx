// 정책 검색창 (자동완성 · 검색 결과 안내)
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import useAutocomplete from "./useAutocomplete";
import { relatedWords } from "../../utils/search";
import { markInput } from "../../utils/text";
import { useApp } from "../../app/AppContext";

export default function SearchBox() {
  const { policies, view, queryInput, query, QX, refs, search, changeQueryInput, clearQuery } = useApp();
  const ac = useAutocomplete(policies, queryInput);
  const related = relatedWords(QX);

  function submit(value = queryInput) { ac.close(); search(value) }
  function onChange(e) { const v = e.target.value; ac.schedule(v); changeQueryInput(v) }
  function onKeyDown(e) {
    if (e.nativeEvent.isComposing) return;
    if (e.key == "ArrowDown" && ac.isOpen) { e.preventDefault(); ac.move(1) }
    else if (e.key == "ArrowUp" && ac.isOpen) { e.preventDefault(); ac.move(-1) }
    else if (e.key == "Escape" && ac.isOpen) { e.preventDefault(); ac.close() }
    else if (e.key == "Enter") { e.preventDefault(); if (ac.isOpen && ac.index >= 0) submit(ac.items[ac.index].v); else submit() }
  }

  return <Panel id="searchbox" role="search" aria-label="정책 검색" hidden={view != "list"}>
    <div className="search">
      <div className="qwrap">
        <input id="q" ref={refs.q} type="search" placeholder="정책명, 기관, 키워드 검색 (예: 농기계, 땅, 교육)" aria-label="정책 검색" role="combobox" aria-autocomplete="list"
          aria-expanded={ac.isOpen} aria-controls="ac" aria-activedescendant={ac.isOpen && ac.index >= 0 ? "ac-" + ac.index : undefined} autoComplete="off"
          value={queryInput} onChange={onChange} onKeyDown={onKeyDown} onBlur={() => { setTimeout(ac.close, 120) }} />
        <ul id="ac" className="ac" role="listbox" aria-label="추천 검색어" hidden={!ac.isOpen} onMouseDown={e => e.preventDefault()}>
          {ac.items.map((o, i) => <li key={i} id={`ac-${i}`} role="option" aria-selected={i == ac.index} onClick={() => submit(o.v)}><span className="k">{o.kind}</span><span className="t">{markInput(o.v, ac.markValue)}</span></li>)}
        </ul>
      </div>
      <Button id="goto" onClick={e => { e.preventDefault(); submit() }}>맞춤 정책 찾기</Button>
    </div>
    <p id="qinfo" className="qinfo" hidden={!query}>{query ? <>
      <b>{`'${query}'`}</b>{` 검색 결과${related.length ? ` · 함께 찾은 말: ${related.slice(0, 6).join(", ")}` : ""} `}<Button variant="outline" className="qclear" onClick={clearQuery}>검색어 지우기</Button>
    </> : null}</p>
  </Panel>;
}
