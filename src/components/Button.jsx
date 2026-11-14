// 버튼. variant: primary(초록 버튼) · soft(연한 초록 버튼) · outline(테두리 버튼) · link(밑줄 글자 버튼)
// as="a"로 링크, as="span"으로 비활성 표시용 글자에도 같은 모양을 씁니다. (스타일: Button.css)
const VARIANT_CLASS = { primary: "btn", soft: "btn s", outline: "ic", link: "lnk" };

export default function Button({ variant = "primary", as: Tag = "button", className, ...props }) {
  return <Tag className={[VARIANT_CLASS[variant], className].filter(Boolean).join(" ")} {...props} />;
}
