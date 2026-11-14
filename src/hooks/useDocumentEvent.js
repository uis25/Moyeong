import { useEffect, useRef } from "react";

/**
 * document에 이벤트 리스너를 한 번만 등록하고, 항상 최신 handler를 호출합니다.
 * (바깥 클릭으로 팝업 닫기, Esc 키, 포커스 이동 감지처럼 화면 전체에서 받아야 하는 이벤트용)
 */
export default function useDocumentEvent(type, handler, capture = false) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const listener = e => ref.current(e);
    document.addEventListener(type, listener, capture);
    return () => document.removeEventListener(type, listener, capture);
  }, [type, capture]);
}
