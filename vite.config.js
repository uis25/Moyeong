import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages(https://uis25.github.io/Moyeong/)는 저장소 이름 아래에 열리므로 빌드할 때만 base를 맞춤
// 개발 서버와 비교 스크립트(npm run compare)는 지금처럼 "/" 사용
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/Moyeong/" : "/",
}));
