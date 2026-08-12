import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminNoticeFormPage } from "./pages/AdminNoticeFormPage";
import { AdminNoticesPage } from "./pages/AdminNoticesPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NoticeDetailPage } from "./pages/NoticeDetailPage";
import { NoticesPage } from "./pages/NoticesPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { SignupPage } from "./pages/SignupPage";

/**
 * 앱 최상위 컴포넌트 + URL 라우팅
 *
 * 경로 정리:
 *   /               → HomePage (로그인 필요)
 *   /me/edit        → ProfileEditPage (로그인 필요)
 *   /admin/members  → AdminMembersPage (admin 필요)
 *   /admin/notices  → 관리자 공지 작성·수정·삭제
 *   /notices        → 공지사항 목록·상세 (공개)
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
        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminNoticesPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notices/new"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminNoticeFormPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notices/:publicId/edit"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminNoticeFormPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:publicId" element={<NoticeDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
