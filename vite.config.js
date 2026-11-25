import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel에 배포 (main에 push하면 Vercel이 직접 빌드). 사이트가 주소 맨 앞(/)에서 열림
export default defineConfig({
  plugins: [react()],
});
