import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAccessToken, fetchMe } from "../api/auth";
import { withdrawMyAccount } from "../api/members";
import { RecruitmentToggle } from "../components/RecruitmentToggle";
import type { MeResponse } from "../types/auth";
import { Loading } from "../components/Loading";

/**
 * 로그인 후 회원 마이페이지
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
  // 회원 탈퇴
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

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

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!withdrawConfirmed) return;
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      const result = await withdrawMyAccount(withdrawPassword);
      clearAccessToken();
      window.alert(result.message);
      navigate("/", { replace: true });
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : "탈퇴에 실패했습니다.");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>마이페이지</h1>
        <p className="subtitle">회원 정보와 관리 메뉴를 확인하세요.</p>

        {loading ? <Loading /> : null}
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
              <dt>사이트 권한</dt>
              <dd>{me.system_role}</dd>
            </div>
            <div>
              <dt>동아리 직책</dt>
              <dd>{me.club_position}</dd>
            </div>
            <div>
              <dt>가입 상태</dt>
              <dd>{me.join_status}</dd>
            </div>
          </dl>
        ) : null}

        {me?.system_role === "admin" ? <RecruitmentToggle /> : null}

        <div className="button-row">
          {me?.system_role === "admin" ? (
            <>
              <Link to="/admin/projects" className="btn-primary-link">
                프로젝트·스터디 관리
              </Link>
              <Link to="/admin/notices" className="btn-primary-link">
                공지사항 관리
              </Link>
              <Link to="/admin/calendar" className="btn-primary-link">
                일정 관리
              </Link>
              <Link to="/admin/gallery" className="btn-primary-link">
                갤러리 관리
              </Link>
              <Link to="/admin/faqs" className="btn-primary-link">
                FAQ 관리
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

        {me ? (
          <section className="withdraw-box" aria-label="회원 탈퇴">
            <button
              type="button"
              className="withdraw-toggle"
              aria-expanded={withdrawOpen}
              onClick={() => setWithdrawOpen((open) => !open)}
            >
              회원 탈퇴
            </button>
            {withdrawOpen ? (
              <form className="form withdraw-form" onSubmit={handleWithdraw}>
                <p>
                  탈퇴하면 회원 정보와 프로젝트·스터디 참여 내역이{" "}
                  <strong>즉시 삭제되며 복구할 수 없습니다.</strong> 작성한
                  공지·사진은 동아리 기록으로 남고 작성자 표시만 사라집니다.{" "}
                  <Link to="/privacy#retention">개인정보 처리방침</Link>
                </p>
                <label className="field">
                  <span>비밀번호 확인</span>
                  <input
                    type="password"
                    value={withdrawPassword}
                    onChange={(event) => setWithdrawPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={withdrawConfirmed}
                    onChange={(event) => setWithdrawConfirmed(event.target.checked)}
                  />
                  <span>
                    <strong>위 내용을 확인했으며 탈퇴합니다.</strong>
                  </span>
                </label>
                {withdrawError ? <p className="error">{withdrawError}</p> : null}
                <button
                  type="submit"
                  className="btn-danger"
                  disabled={withdrawing || !withdrawConfirmed || !withdrawPassword}
                >
                  {withdrawing ? "처리 중..." : "탈퇴하기"}
                </button>
              </form>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
