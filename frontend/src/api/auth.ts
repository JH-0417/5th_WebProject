import { apiRequest } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from "../types/auth";

/**
 * 인증 관련 API 모음
 *
 * 화면(LoginPage / SignupPage)은 fetch 를 직접 쓰지 않고
 * 여기 함수만 호출합니다. (역할 분리)
 */

/** POST /auth/login — 성공 시 JWT access_token 반환 */
export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    // 객체를 JSON 문자열로 바꿔 body 에 넣음
    body: JSON.stringify(payload),
  });
}

/**
 * POST /auth/signup — 가입 신청
 * 성공해도 토큰은 없음. join_status=pending 상태로 DB 에만 저장됨.
 */
export function signup(payload: SignupRequest): Promise<SignupResponse> {
  return apiRequest<SignupResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** localStorage 에 토큰을 넣을 때 쓰는 키 이름 */
const TOKEN_KEY = "access_token";

/** 로그인 성공 후 토큰 저장 (나중에 API 호출 때 Authorization 헤더로 사용) */
export function saveAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** 저장된 토큰 읽기 (없으면 null) */
export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** 로그아웃 시 토큰 삭제 */
export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
