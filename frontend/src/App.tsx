import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminActivitiesPage } from "./pages/AdminActivitiesPage";
import { AdminActivityFormPage } from "./pages/AdminActivityFormPage";
import { AdminGalleryPage } from "./pages/AdminGalleryPage";
import { AdminMembersPage } from "./pages/AdminMembersPage";
import { AdminNoticeFormPage } from "./pages/AdminNoticeFormPage";
import { AdminNoticesPage } from "./pages/AdminNoticesPage";
import { ActivityDetailPage } from "./pages/ActivityDetailPage";
import { ActivityListPage } from "./pages/ActivityListPage";
import { FaqsPage } from "./pages/FaqsPage";
import { GalleryDetailPage } from "./pages/GalleryDetailPage";
import { GalleryPage } from "./pages/GalleryPage";
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
 *   /admin/projects → 관리자 프로젝트 작성·수정·삭제
 *   /admin/studies  → 관리자 스터디 작성·수정·삭제
 *   /admin/gallery  → 관리자 갤러리 등록·수정·삭제
 *   /notices        → 공지사항 목록·상세 (공개)
 *   /projects       → 프로젝트 목록·상세 (공개)
 *   /studies        → 스터디 목록·상세 (공개)
 *   /gallery        → 갤러리 목록·상세 (공개)
 *   /faqs           → 자주 묻는 질문 목록 (공개)
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
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminActivitiesPage kind="projects" />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects/new"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminActivityFormPage kind="projects" />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects/:publicId/edit"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminActivityFormPage kind="projects" />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/studies"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminActivitiesPage kind="studies" />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/studies/new"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminActivityFormPage kind="studies" />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/studies/:publicId/edit"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminActivityFormPage kind="studies" />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gallery"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminGalleryPage />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/notices/:publicId" element={<NoticeDetailPage />} />
        <Route
          path="/projects"
          element={<ActivityListPage kind="projects" />}
        />
        <Route
          path="/projects/:publicId"
          element={<ActivityDetailPage kind="projects" />}
        />
        <Route
          path="/studies"
          element={<ActivityListPage kind="studies" />}
        />
        <Route
          path="/studies/:publicId"
          element={<ActivityDetailPage kind="studies" />}
        />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/:publicId" element={<GalleryDetailPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
