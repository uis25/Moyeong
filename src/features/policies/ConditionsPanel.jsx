// 내 조건 (카테고리 · 모집 상태 · 나이 · 지역 · 경력 · 경영체 등록) + 제목 줄 오른쪽 전체 초기화 버튼
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import FilterRow from "./FilterRow";
import SelectField from "./SelectField";
import { CATEGORIES, STATUSES, REGIONS, EXPERIENCE_LABELS, BUSINESS_OPTIONS } from "../../constants/conditions";
import { useApp } from "../../app/AppContext";

/** 조건을 하나라도 골랐는지 */
const hasCondition = c => c.age !== "" || !!c.region || c.exp !== "" || c.biz !== "" || c.cats.length > 0 || c.sts.length > 0;

export default function ConditionsPanel() {
  const { view, conditions: c, refs, changeCondition, toggleFilter, resetAll } = useApp();
  const onChange = field => e => changeCondition(field, e.target.value);

  return <Panel id="top-panel" ref={refs.topPanel} hidden={view != "list"}>
    {/* 전체 초기화: 조건이 없을 때도 자리는 차지한 채 숨겨 두어, 버튼이 생기고 없어져도 상자 크기가 바뀌지 않음 */}
    <div className="phead"><h2>내 조건</h2><Button variant="outline" id="reset" className={hasCondition(c) ? undefined : "off"} aria-hidden={hasCondition(c) ? undefined : "true"} onClick={resetAll}>전체 초기화</Button></div>
    <FilterRow id="cats" label="카테고리" options={CATEGORIES} selected={c.cats} onToggle={x => toggleFilter("cats", x)} chipsRef={refs.cats} />
    <FilterRow id="sts" label="모집 상태" options={STATUSES} selected={c.sts} onToggle={x => toggleFilter("sts", x)} chipsRef={refs.sts} />
    <div className="row">
      <div><label htmlFor="age">만 나이</label><input id="age" ref={refs.age} type="number" min="0" max="120" placeholder="예: 32" value={c.age} onChange={onChange("age")} /></div>
      <SelectField id="reg" label="영농 지역" value={c.region} options={REGIONS.map(r => [r, r])} onChange={v => changeCondition("region", v)} />
      <SelectField id="exp" label="영농경력" value={c.exp} options={EXPERIENCE_LABELS.map((l, i) => [String(i), l])} onChange={v => changeCondition("exp", v)} />
      <SelectField id="biz" label="농업경영체 등록" value={c.biz} options={BUSINESS_OPTIONS} onChange={v => changeCondition("biz", v)} />
    </div>
  </Panel>;
}
