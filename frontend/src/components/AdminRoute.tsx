import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { clearAccessToken, fetchMe, getAccessToken } from "../api/auth";

type AdminRouteProps = {
  children: ReactNode;
};

/**
 * admin 역할만 통과시키는 가드
 *
 * - 토큰으로 /auth/me 를 호출해 role 확인
 * - admin 이 아니면 홈(/)으로 보냄
 * - 토큰 무효면 로그인으로 보냄
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setAllowed(me.role === "admin");
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          setAllowed(false);
        }
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (allowed === null) {
    return (
      <main className="page">
        <p className="muted">권한 확인 중...</p>
      </main>
    );
  }

  // 토큰이 지워진 경우(fetchMe 실패)는 로그인으로
  // role 이 admin 이 아니면 대시보드로
  if (!allowed) {
    const tokenGone = !getAccessToken();
    return <Navigate to={tokenGone ? "/login" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
