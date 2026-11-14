// 공식 공고 바로가기 링크 모음
import Panel from "../../components/Panel";
import { OFFICIAL_SOURCES } from "../../constants/sources";
import { useApp } from "../../app/AppContext";

export default function OfficialSources() {
  const { view, refs } = useApp();
  return <Panel id="srcs" ref={refs.srcs} hidden={view != "list"}>
    <h2>공식 공고 바로가기</h2>
    <p className="hint">도청, 시청, 농업기술센터, 농어촌공사 공고를 한곳에서 확인하시기 바랍니다. 새 공고는 아래 공식 사이트에 먼저 올라오고, 이 페이지의 정보와 다르면 공식 사이트가 기준입니다.</p>
    <div className="chips">{OFFICIAL_SOURCES.map(([href, label]) => <a key={href} className="chip" style={{ textDecoration: "none", color: "inherit" }} href={href} target="_blank" rel="noopener noreferrer">{`${label} ↗`}</a>)}</div>
  </Panel>;
}
