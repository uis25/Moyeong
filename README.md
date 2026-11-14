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
- 실패한 묶음은 자동으로 한 번 더 실행하고, 두 번 모두 다를 때만 차이로 보고합니다 (브라우저 타이밍에 따른 일시적 차이 제외).
- 결과: 마지막 줄에 `✓ 모든 단계가 원본과 같습니다.` 또는 `✗ N단계가 다릅니다.`
- 다른 단계가 있으면 `compare-results/` 폴더에 원본·React·차이(빨간 표시) 이미지가 저장됩니다.
- 개발 서버를 따로 켜 둘 필요는 없습니다 (스크립트가 직접 띄우고 끕니다).
- 원본과 의도적으로 다르게 한 부분은 [docs/differences.md](docs/differences.md)에 있습니다.

## 폴더 구조

```
src/
  main.jsx        저장값을 모두 불러온 뒤(loadAppData) 첫 화면을 그림
  App.jsx         AppProvider + AppLayout
  app/            여러 기능이 함께 쓰는 상태·동작(AppProvider, useApp)과 전체 화면 배치(AppLayout)
  components/     여러 곳에서 쓰는 UI: Button(variant) · Chip · Badge · Tag · Panel · EmptyState · PolicyRow · Icon
  features/
    navigation/   상단 메뉴 · 메뉴 안내판 · 제목 영역 · 사이트 정보
    home/         메인 홈 화면
    policies/     정책 모아보기: 검색(자동완성) · 내 조건 · 결과 막대 · 카드 · 상세 · 쪽 번호 · 공식 링크
    reviews/      선배 후기
    calendar/     신청 달력
    favorites/    관심 정책
    records/      신청 기록
  hooks/          여러 기능이 쓰는 훅 (useDocumentEvent)
  utils/          순수 함수: 날짜 · 모집 상태 · 자격 판정 · 검색 · 목록 정렬 · 후기 통계 · 텍스트
  constants/      고정 데이터: 정책 데이터 · 카테고리 · 메뉴 문구 · 유사어 · 공식 링크
  services/       저장·불러오기 (지금은 localStorage, 나중에 서버 API)
  styles/         디자인 토큰(tokens.css) · 기본 스타일 · 스타일 불러오는 순서(index.css)
```

- 스타일은 컴포넌트 옆에 `.css`로 두되, CSS 적용 순서를 원본과 같게 하려고 `styles/index.css`에서 순서대로 불러옵니다.
- 색상·글자 크기·간격·둥글기·그림자 값은 `styles/tokens.css`의 CSS 변수로만 씁니다.

## 저장 데이터

컴포넌트는 localStorage를 직접 쓰지 않고 `src/services`의 async 함수만 씁니다. 서버로 바꿀 때는 `services/` 안만 고치면 됩니다.

| 키 | 서비스 함수 | 내용 |
|---|---|---|
| `bmy` | `getConditions` · `saveConditions` | 내 조건 `{age, region, exp, biz, cats[], sts[]}` |
| `bmy_fav` | `getFavorites` · `saveFavorite` · `removeFavorite` | 관심 정책 id 배열 |
| `bmy_docs` | `getDocumentChecks` · `saveDocumentCheck` | 서류 체크 `{"정책id:서류번호": true/false}` |
| `bmy_rec` | `getRecords` · `saveRecord` · `removeRecord` | 신청 기록 `{정책id: "관심 있음"·"신청 준비 중"·"신청 완료"·"결과 확인"}` |
| `bmy_rv` | `getReviews` · `saveReview` · `removeReview` | 후기 `[{id, policyId, authorId, rating, keywords[], content, createdAt, updatedAt}]` |
| `bmy_uid` | `getUserId` | 이 기기의 작성자 id |
| (없음) | `getPolicies` | 정책 목록 (지금은 `constants/policies.json`) |

- `get*`은 저장된 데이터를, `save*`·`remove*`는 바뀐 뒤의 전체 데이터를 돌려줍니다.
