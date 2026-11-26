// 의견 작성 창 (브라우저 기본 <dialog>: Esc로 닫기, 열려 있는 동안 포커스가 창 안에 머묾)
// 상태: 작성 → 보내는 중 → 완료(2초 뒤 닫고 입력 비움) / 실패(입력 그대로, "다시 보내기")
import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { useApp } from "../../app/AppContext";
import { sendFeedback } from "../../services/feedbackService";
import { FEEDBACK_RATINGS, FEEDBACK_TYPES, FEEDBACK_MAX_LENGTH } from "../../constants/feedback";
import character from "../../assets/feedback-character.webp";

const DONE_CLOSE_MS = 2000;

export default function FeedbackDialog({ open, onClose }) {
  const { view, openId, userId } = useApp();
  const ref = useRef(null);
  const doneRef = useRef(null);
  const [rating, setRating] = useState(null);
  const [type, setType] = useState(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle"); // idle · sending · done · error
  const [msg, setMsg] = useState("");

  // 열기·닫기
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // 완료 화면: 안내를 읽을 수 있게 포커스를 옮기고, 잠시 뒤 닫힘
  useEffect(() => {
    if (status != "done") return;
    doneRef.current?.focus();
    const t = setTimeout(() => ref.current.close(), DONE_CLOSE_MS);
    return () => clearTimeout(t);
  }, [status]);

  // X · Esc · 바깥 클릭 · 완료 후 자동 닫힘이 모두 여기로 옴
  function handleClosed() {
    if (status == "done") { setRating(null); setType(null); setContent(""); setStatus("idle") }
    setMsg("");
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    const text = content.trim();
    if (!rating || !type || !text) { setMsg("만족도, 의견 종류, 내용을 모두 입력해 주세요."); return }
    setStatus("sending"); setMsg("");
    try {
      await sendFeedback({
        rating, type, content: text, view,
        policyId: view == "list" ? openId : null, // 상세가 보이는 곳은 정책 목록뿐 (다른 화면에선 openId가 남아 있어도 저장 안 함)
        device: window.matchMedia("(max-width:720px)").matches ? "mobile" : "desktop",
        authorId: userId,
      });
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  const close = () => ref.current.close();
  return <dialog ref={ref} className="fbdlg" aria-labelledby="fb-title" onClose={handleClosed}
    onClick={e => { if (e.target == ref.current) close() }}>
    <div className="fbin">
      {status == "done" ? <div className="fbdone" ref={doneRef} tabIndex={-1} role="status">
        <img src={character} alt="" width="80" height="80" />
        <p className="fbdone-t">소중한 의견 고마워요</p>
        <p className="meta">보내 주신 의견은 밭모영을 더 낫게 만드는 데 쓸게요.</p>
      </div> : <form onSubmit={submit} noValidate>
        <div className="fbhead">
          <h2 id="fb-title">의견 남기기</h2>
          <button type="button" className="fbx" aria-label="닫기" onClick={close}>✕</button>
        </div>

        <fieldset>
          <legend>밭모영은 어땠나요?</legend>
          <div className="chips fbrate">{FEEDBACK_RATINGS.map(r =>
            <Chip key={r.value} type="button" pressed={rating == r.value} aria-label={r.label} title={r.label}
              onClick={() => setRating(rating == r.value ? null : r.value)}>{r.emoji}</Chip>)}</div>
        </fieldset>

        <fieldset>
          <legend>어떤 의견인가요?</legend>
          <div className="chips">{FEEDBACK_TYPES.map(t =>
            <Chip key={t} type="button" pressed={type == t} onClick={() => setType(type == t ? null : t)}>{t}</Chip>)}</div>
        </fieldset>

        <label className="fblabel" htmlFor="fb-content">의견 내용</label>
        <textarea id="fb-content" maxLength={FEEDBACK_MAX_LENGTH} value={content} aria-describedby="fb-count"
          placeholder="불편했던 점, 있었으면 하는 기능, 좋았던 점을 자유롭게 적어 주세요."
          onChange={e => setContent(e.target.value)}></textarea>
        <div className="fbcount" id="fb-count">{`남은 글자 ${FEEDBACK_MAX_LENGTH - content.length}`}</div>

        {msg && !(rating && type && content.trim()) ? <p className="fberr" role="alert">{msg}</p> : null}
        {status == "error" ? <p className="fberr" role="alert">전송하지 못했어요. 인터넷 연결을 확인하고 다시 보내기를 눌러 주세요.</p> : null}
        <Button type="submit" className="fbsubmit" disabled={status == "sending"}>
          {status == "sending" ? "보내는 중…" : status == "error" ? "다시 보내기" : "보내기"}
        </Button>
      </form>}
    </div>
  </dialog>;
}
