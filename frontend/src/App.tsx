import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";

/**
 * 앱 최상위 컴포넌트 + URL 라우팅
 *
 * BrowserRouter: 브라우저 주소창 URL 을 React 가 감지하게 함
 * Routes / Route: URL 경로마다 어떤 페이지를 보여줄지 정함
 *
 * 경로 정리:
 *   /login  → LoginPage (로그인)
 *   /signup → SignupPage (가입 신청)
 *   /       → /login 으로 보냄 (메인 페이지는 아직 없음)
 *   *       → 없는 주소도 /login 으로 보냄
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* path: 주소, element: 그 주소에서 보여줄 화면 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Navigate: 다른 경로로 바로 이동 (리다이렉트) */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
