# Moyeong

밭모영 – 제주 청년농 정책 찾기 (Vite + React)

## 실행

```bash
npm install
npm run dev
```

- React 앱: http://localhost:5173/
- 원본(비교용): http://localhost:5173/original/original/index.html

## 원본과 비교하기

원본 HTML과 React 앱을 같은 순서로 조작하면서 화면(픽셀)·글자·스크롤 위치·저장값이 같은지 자동으로 확인합니다.

```bash
npx playwright install chromium   # 처음 한 번만 (비교용 브라우저 설치)
npm run compare                   # 전체 비교 (몇 분 걸림)
npm run compare -- mobile         # 한 묶음만: desktop, desktop-full, dark, tablet, mobile, mobile-full
```

- 비교 항목: 스크린샷 픽셀, 보이는 모든 요소의 계산된 스타일과 위치·크기, 화면 글자, 스크롤 위치, localStorage
- 결과: 마지막 줄에 `✓ 모든 단계가 원본과 같습니다.` 또는 `✗ N단계가 다릅니다.`
- 다른 단계가 있으면 `compare-results/` 폴더에 원본·React·차이(빨간 표시) 이미지가 저장됩니다.
- 개발 서버를 따로 켜 둘 필요는 없습니다 (스크립트가 직접 띄우고 끕니다).
- 원본과 의도적으로 다르게 한 부분은 [docs/differences.md](docs/differences.md)에 있습니다.
