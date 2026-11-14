// 앱 최상위: 공유 상태(AppProvider) + 화면 배치(AppLayout)
import AppProvider from "./app/AppProvider";
import AppLayout from "./app/AppLayout";

export default function App({ initial }) {
  return <AppProvider initial={initial}>
    <AppLayout />
  </AppProvider>;
}
