// 내 조건 (카테고리 · 모집 상태 · 나이 · 지역 · 경력 · 경영체 등록) + 선택한 조건 태그
import Panel from "../../components/Panel";
import Button from "../../components/Button";
import Tag from "../../components/Tag";
import FilterRow from "./FilterRow";
import SelectField from "./SelectField";
import { CATEGORIES, STATUSES, REGIONS, EXPERIENCE_LABELS, BUSINESS_OPTIONS } from "../../constants/conditions";
import { useApp } from "../../app/AppContext";

/** 선택한 조건 → [삭제 키, 태그 문구] */
function conditionTags(c) {
  const tags = [];
  if (c.age !== "") tags.push(["age", `만 ${c.age}세`]);
  if (c.region) tags.push(["region", c.region]);
  if (c.exp !== "") tags.push(["exp", EXPERIENCE_LABELS[c.exp]]);
  if (c.biz !== "") tags.push(["biz", c.biz === "1" ? "경영체 등록" : "경영체 미등록"]);
  c.cats.forEach(x => tags.push(["cats:" + x, x]));
  c.sts.forEach(x => tags.push(["sts:" + x, x]));
  return tags;
}

export default function ConditionsPanel() {
  const { view, conditions: c, refs, changeCondition, toggleFilter, removeTag, resetAll } = useApp();
  const tags = conditionTags(c);
  const onChange = field => e => {
    const v = e.target.value;
    /* 원본 render()는 매번 입력칸 값을 다시 써서, 숫자가 아닌 입력(예: "1e")은 지워졌습니다 */
    if (field == "age") e.target.value = v;
    changeCondition(field, v);
  };

  return <Panel id="top-panel" ref={refs.topPanel} hidden={view != "list"}>
    <div className="phead"><h2>내 조건</h2><p className="hint">나이·지역·경력·경영체 등록 여부를 입력하면 기본 조건이 맞는 정책을 먼저 보여드립니다. 조건은 이 기기에만 저장됩니다.</p></div>
    <FilterRow id="cats" label="카테고리" options={CATEGORIES} selected={c.cats} onToggle={x => toggleFilter("cats", x)} chipsRef={refs.cats} />
    <FilterRow id="sts" label="모집 상태" options={STATUSES} selected={c.sts} onToggle={x => toggleFilter("sts", x)} chipsRef={refs.sts} />
    <div className="row">
      <div><label htmlFor="age">만 나이</label><input id="age" ref={refs.age} type="number" min="0" max="120" placeholder="예: 32" value={c.age} onChange={onChange("age")} /></div>
      <SelectField id="reg" label="영농 지역" value={c.region} options={REGIONS.map(r => [r, r])} onChange={onChange("region")} />
      <SelectField id="exp" label="영농경력" value={c.exp} options={EXPERIENCE_LABELS.map((l, i) => [String(i), l])} onChange={onChange("exp")} />
      <SelectField id="biz" label="농업경영체 등록" value={c.biz} options={BUSINESS_OPTIONS} onChange={onChange("biz")} />
    </div>
    <div className="chips" id="tags" aria-live="polite">
      {tags.length ? <Button variant="outline" id="reset" onClick={resetAll}>전체 초기화</Button> : null}
      {tags.map(([key, text]) => <Tag as="button" key={key} aria-label={`${text} 필터 해제`} onClick={() => removeTag(key)}>{`${text} ✕`}</Tag>)}
    </div>
  </Panel>;
}
