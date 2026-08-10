import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";

/**
 * 가입 신청 페이지 컴포넌트
 *
 * - 백엔드 POST /auth/signup 과 같은 필드를 폼으로 받습니다.
 * - 성공해도 JWT를 받지 않습니다. (승인 전에는 로그인 불가)
 * - 서버가 준 message 를 보여 준 뒤, 로그인 페이지로 이동할 수 있습니다.
 */
export function SignupPage() {
  // 페이지 이동용 훅. 예: navigate("/login")
  const navigate = useNavigate();

  // --- 폼 입력값 (useState = 값이 바뀌면 화면이 다시 그려짐) ---
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  // 지원 문항 2개 (백엔드 apply_reason, desired_activity)
  const [applyReason, setApplyReason] = useState("");
  const [desiredActivity, setDesiredActivity] = useState("");

  // --- 화면 상태 ---
  const [error, setError] = useState<string | null>(null); // 실패 메시지
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // 성공 메시지
  const [loading, setLoading] = useState(false); // 버튼 중복 클릭 방지

  /** 폼 제출 → signup API 호출 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // HTML form 기본 동작(새로고침)을 막음
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      // 프론트 변수명(camelCase) → 백엔드 필드명(snake_case)으로 맞춤
      const result = await signup({
        login_id: loginId,
        password,
        name,
        student_id: studentId,
        department,
        grade,
        phone_number: phoneNumber,
        email,
        apply_reason: applyReason,
        desired_activity: desiredActivity,
      });
      // 예: "가입 신청이 완료되었습니다. 면접 및 승인 완료 후 이용 가능합니다."
      setSuccessMessage(result.message);
    } catch (err) {
      // api/client.ts 에서 throw 한 Error.message 를 그대로 표시
      const message =
        err instanceof Error ? err.message : "가입 신청에 실패했습니다.";
      setError(message);
    } finally {
      // 성공/실패와 관계없이 로딩 해제
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>가입 신청</h1>
        <p className="subtitle">
          필수 정보와 지원 문항을 작성해 주세요. 면접 및 승인 후 이용할 수
          있습니다.
        </p>

        {/* 성공 후에는 폼 대신 결과 박스를 보여 줌 */}
        {successMessage ? (
          <div className="result-box">
            <p className="success">{successMessage}</p>
            {/* navigate: JS로 /login URL 로 이동 */}
            <button type="button" onClick={() => navigate("/login")}>
              로그인 하러 가기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            {/*
              value + onChange 패턴:
              - value={state} : 화면에 보여줄 값
              - onChange : 사용자가 칠 때마다 state 를 갱신
            */}
            <label className="field">
              <span>아이디</span>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                maxLength={12}
                autoComplete="username"
              />
            </label>

            <label className="field">
              <span>비밀번호 (8자 이상)</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                maxLength={64}
                autoComplete="new-password"
              />
            </label>

            <label className="field">
              <span>이름</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={30}
              />
            </label>

            <label className="field">
              <span>학번</span>
              <input
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                maxLength={10}
              />
            </label>

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
                // input 값은 문자열이므로 Number() 로 숫자 변환
                onChange={(e) => setGrade(Number(e.target.value))}
                required
              />
            </label>

            <label className="field">
              <span>휴대폰 (하이픈 없이, 예: 01012345678)</span>
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
              <span>지원 사유</span>
              {/* textarea: 여러 줄 입력 (지원 문항) */}
              <textarea
                value={applyReason}
                onChange={(e) => setApplyReason(e.target.value)}
                required
                rows={4}
                maxLength={2000}
              />
            </label>

            <label className="field">
              <span>동아리 들어와서 해보고 싶은 활동</span>
              <textarea
                value={desiredActivity}
                onChange={(e) => setDesiredActivity(e.target.value)}
                required
                rows={4}
                maxLength={2000}
              />
            </label>

            {/* error 가 있을 때만 빨간 문구 표시 (삼항 연산자) */}
            {error ? <p className="error">{error}</p> : null}

            <button type="submit" disabled={loading}>
              {loading ? "신청 중..." : "가입 신청하기"}
            </button>
          </form>
        )}

        {/* Link: a태그처럼 보이지만 새로고침 없이 /login 으로 이동 */}
        <p className="switch-link">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}
