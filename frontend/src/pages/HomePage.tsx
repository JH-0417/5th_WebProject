import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAccessToken, fetchMe } from "../api/auth";
import type { MeResponse } from "../types/auth";

/**
 * 로그인 후 홈(내 정보) 페이지
 *
 * 흐름:
 * 1) 마운트 시 GET /auth/me 호출
 * 2) 성공하면 이름/아이디 등 표시
 * 3) 실패(만료·잘못된 토큰)면 토큰 지우고 로그인으로 이동
 * 4) 로그아웃 버튼 → 토큰 삭제 + /login
 */
export function HomePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMe();
        if (!cancelled) {
          setMe(data);
        }
      } catch (err) {
        if (cancelled) return;
        clearAccessToken();
        const message =
          err instanceof Error ? err.message : "내 정보를 불러오지 못했습니다.";
        setError(message);
        navigate("/login", { replace: true });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function handleLogout() {
    clearAccessToken();
    navigate("/login", { replace: true });
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>홈</h1>
        <p className="subtitle">로그인된 회원 정보입니다.</p>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {me ? (
          <dl className="info-list">
            <div>
              <dt>이름</dt>
              <dd>{me.name}</dd>
            </div>
            <div>
              <dt>아이디</dt>
              <dd>{me.login_id}</dd>
            </div>
            <div>
              <dt>학번</dt>
              <dd>{me.student_id}</dd>
            </div>
            <div>
              <dt>학과</dt>
              <dd>{me.department}</dd>
            </div>
            <div>
              <dt>학년</dt>
              <dd>{me.grade}</dd>
            </div>
            <div>
              <dt>휴대폰</dt>
              <dd>{me.phone_number}</dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{me.email}</dd>
            </div>
            <div>
              <dt>GitHub</dt>
              <dd>{me.github_username || "-"}</dd>
            </div>
            <div>
              <dt>자기소개</dt>
              <dd>{me.bio || "-"}</dd>
            </div>
            <div>
              <dt>기술 스택</dt>
              <dd>{me.tech_stack || "-"}</dd>
            </div>
            <div>
              <dt>역할</dt>
              <dd>{me.role}</dd>
            </div>
            <div>
              <dt>가입 상태</dt>
              <dd>{me.join_status}</dd>
            </div>
          </dl>
        ) : null}

        <div className="button-row">
          <Link to="/projects" className="btn-primary-link">
            프로젝트
          </Link>
          <Link to="/studies" className="btn-primary-link">
            스터디
          </Link>
          <Link to="/notices" className="btn-primary-link">
            공지사항
          </Link>
          {me?.role === "admin" ? (
            <>
              <Link to="/admin/notices" className="btn-primary-link">
                공지사항 관리
              </Link>
              <Link to="/admin/members" className="btn-primary-link">
                가입 신청 관리
              </Link>
            </>
          ) : null}
          <Link to="/me/edit" className="btn-primary-link">
            내 정보 수정
          </Link>
          <button type="button" className="btn-secondary" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </section>
    </main>
  );
}
