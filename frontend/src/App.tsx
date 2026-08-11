import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { SignupPage } from "./pages/SignupPage";

/**
 * 앱 최상위 컴포넌트 + URL 라우팅
 *
 * 경로 정리:
 *   /               → HomePage (로그인 필요)
 *   /me/edit        → ProfileEditPage (로그인 필요)
 *   /admin/members  → AdminMembersPage (admin 필요)
 *   /login, /signup → 인증 페이지
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me/edit"
          element={
            <ProtectedRoute>
              <ProfileEditPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/members"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminMembersPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
