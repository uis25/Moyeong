// 오른쪽 아래에 늘 떠 있는 캐릭터 버튼. 누르면 의견 작성 창이 열림
import { useCallback, useState } from "react";
import FeedbackDialog from "./FeedbackDialog";
import character from "../../assets/feedback-character.webp";
import "./Feedback.css";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <>
    <button type="button" className="fbbtn" aria-label="의견 남기기" aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <img src={character} alt="" width="64" height="64" />
    </button>
    {/* 닫아도 쓰던 내용이 남도록 창은 늘 그려 두고 열고 닫기만 함 */}
    <FeedbackDialog open={open} onClose={close} />
  </>;
}
