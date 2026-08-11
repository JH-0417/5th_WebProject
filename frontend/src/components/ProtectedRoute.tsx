import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken } from "../api/auth";

type ProtectedRouteProps = {
  /** 토큰이 있을 때만 보여줄 화면 */
  children: ReactNode;
};

/**
 * 로그인(토큰)이 필요한 페이지를 감싸는 가드 컴포넌트
 *
 * - localStorage 에 access_token 이 있으면 children 을 그대로 보여 줌
 * - 없으면 /login 으로 보냄 (replace: 뒤로가기 시 보호 페이지로 안 돌아가게)
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
