import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAccessToken, fetchMe } from "../api/auth";
import { changeMyPassword, updateMyProfile } from "../api/members";

/**
 * 마이페이지 수정 화면
 *
 * - 위: 프로필 수정 (PATCH /members/me)
 * - 아래: 비밀번호 변경 (PATCH /members/me/password)
 */
export function ProfileEditPage() {
  const navigate = useNavigate();

  // --- 프로필 폼 ---
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [bio, setBio] = useState("");
  const [techStack, setTechStack] = useState("");

  // --- 비밀번호 폼 ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // --- 화면 상태 ---
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // 처음 들어올 때 현재 내 정보로 폼을 채움
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setDepartment(me.department);
        setGrade(me.grade);
        setPhoneNumber(me.phone_number);
        setEmail(me.email);
        setGithubUsername(me.github_username ?? "");
        setBio(me.bio ?? "");
        setTechStack(me.tech_stack ?? "");
      } catch (err) {
        if (cancelled) return;
        clearAccessToken();
        navigate("/login", { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);

    try {
      await updateMyProfile({
        department,
        grade,
        phone_number: phoneNumber,
        email,
        // 빈 문자열은 null 로 보내서 DB 선택 항목을 비울 수 있게 함
        github_username: githubUsername.trim() || null,
        bio: bio.trim() || null,
        tech_stack: techStack.trim() || null,
      });
      setProfileSuccess("프로필이 저장되었습니다.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "프로필 저장에 실패했습니다.";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setSavingPassword(true);

    try {
      const result = await changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(result.message);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.";
      setPasswordError(message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="card card-wide">
          <p className="muted">불러오는 중...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>내 정보 수정</h1>
        <p className="subtitle">프로필과 비밀번호를 변경할 수 있습니다.</p>

        <form onSubmit={handleProfileSubmit} className="form">
          <h2 className="section-title">프로필</h2>

          <label className="field">
            <span>학과</span>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              maxLength={50}
            />
          </label>

          <label className="field">
            <span>학년 (1~4)</span>
            <input
              type="number"
              min={1}
              max={4}
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              required
            />
          </label>

          <label className="field">
            <span>휴대폰 (하이픈 없이)</span>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              pattern="\d{9,11}"
              inputMode="numeric"
            />
          </label>

          <label className="field">
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>GitHub 사용자명 (선택)</span>
            <input
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              maxLength={39}
            />
          </label>

          <label className="field">
            <span>자기소개 (선택)</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </label>

          <label className="field">
            <span>기술 스택 (선택)</span>
            <textarea
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              rows={2}
              maxLength={2000}
            />
          </label>

          {profileError ? <p className="error">{profileError}</p> : null}
          {profileSuccess ? <p className="success">{profileSuccess}</p> : null}

          <button type="submit" disabled={savingProfile}>
            {savingProfile ? "저장 중..." : "프로필 저장"}
          </button>
        </form>

        <hr className="divider" />

        <form onSubmit={handlePasswordSubmit} className="form">
          <h2 className="section-title">비밀번호 변경</h2>

          <label className="field">
            <span>현재 비밀번호</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <label className="field">
            <span>새 비밀번호 (8자 이상)</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              maxLength={64}
              autoComplete="new-password"
            />
          </label>

          {passwordError ? <p className="error">{passwordError}</p> : null}
          {passwordSuccess ? <p className="success">{passwordSuccess}</p> : null}

          <button type="submit" disabled={savingPassword}>
            {savingPassword ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
