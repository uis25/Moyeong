// 흰 바탕 둥근 상자 영역 (section.panel). hidden이면 숨김(display:none). 스타일: Panel.css
export default function Panel({ hidden, style, ...props }) {
  return <section className="panel" style={{ ...style, display: hidden ? "none" : "" }} {...props} />;
}
