import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { login, saveAccessToken } from "../api/auth";

/**
 * 로그인 페이지
 *
 * 흐름:
 * 1) 사용자가 아이디/비밀번호 입력
 * 2) POST /auth/login 호출
 * 3) 성공하면 access_token 을 localStorage 에 저장
 * 4) 실패하면 서버가 준 메시지를 화면에 표시
 */
export function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const result = await login({
        login_id: loginId,
        password,
      });
      saveAccessToken(result.access_token);
      setSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card">
        <h1>제5세대 로그인</h1>
        <p className="subtitle">동아리 계정으로 로그인해 주세요.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>아이디</span>
            <input
              type="text"
              name="login_id"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              maxLength={12}
            />
          </label>

          <label className="field">
            <span>비밀번호</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="error">{error}</p> : null}
          {success ? (
            <p className="success">로그인 성공! 토큰이 저장되었습니다.</p>
          ) : null}

          <button type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* Link: 페이지 새로고침 없이 /signup 으로 이동 (react-router) */}
        <p className="switch-link">
          아직 계정이 없나요? <Link to="/signup">가입 신청</Link>
        </p>
      </section>
    </main>
  );
}
