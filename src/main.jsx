// 원본은 Google Fonts CDN(Noto Sans KR 400/500/700/800)을 불러왔습니다. 같은 굵기를 npm 패키지로 불러옵니다.
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";
import "@fontsource/noto-sans-kr/800.css";
import "./styles/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { loadAppData } from "./services";
import { runEligibilitySelfTest } from "./utils/eligibility";

runEligibilitySelfTest();

// 저장된 데이터를 모두 불러온 뒤 첫 화면을 그립니다 (빈 화면이 잠깐 보이는 깜빡임 방지)
async function bootstrap() {
  const initial = await loadAppData();
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App initial={initial} />
    </StrictMode>
  );
}
bootstrap();
