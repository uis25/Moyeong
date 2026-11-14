// 작은 초록 태그 (선택한 조건, 후기 키워드). as="button"이면 눌러서 해제. 스타일: Tag.css
export default function Tag({ as: El = "span", ...props }) {
  return <El className="tag" {...props} />;
}
