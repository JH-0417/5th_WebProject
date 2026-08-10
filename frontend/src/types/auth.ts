/**
 * 인증(로그인/가입) 관련 TypeScript 타입
 *
 * type 을 정해 두면:
 * - 잘못된 필드명을 쓰면 편집 전에 에러를 잡을 수 있고
 * - 백엔드 JSON 구조와 프론트를 맞춰 두기 쉽습니다.
 */

/** POST /auth/login 요청 body */
export type LoginRequest = {
  login_id: string;
  password: string;
};

/** POST /auth/login 성공 응답 */
export type LoginResponse = {
  access_token: string;
  token_type: string; // 보통 "bearer"
};

/**
 * POST /auth/signup 요청 body
 * 백엔드 schemas.MemberSignupRequest 필드와 이름을 같게 맞춤 (snake_case)
 */
export type SignupRequest = {
  login_id: string;
  password: string;
  name: string;
  student_id: string;
  department: string;
  grade: number; // 1~4
  phone_number: string; // 하이픈 없는 숫자
  email: string;
  apply_reason: string; // 지원 사유
  desired_activity: string; // 해보고 싶은 활동
};

/** POST /auth/signup 성공 응답 */
export type SignupResponse = {
  message: string; // 사용자에게 보여줄 안내 문구
  member: {
    public_id: string;
    login_id: string;
    name: string;
    join_status?: string; // pending / approved / rejected
    is_approved?: boolean;
  };
};

/**
 * 백엔드 에러 JSON 형태
 * - 일반: { "detail": "메시지" }
 * - 검증 실패(422): { "detail": "...", "errors": [ ... ] }
 */
export type ApiErrorBody = {
  detail?: string | { msg?: string }[];
  errors?: { field: string; message: string }[];
};
