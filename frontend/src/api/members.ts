import { apiRequest } from "./client";
import { getAccessToken } from "./auth";
import type {
  MeResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
} from "../types/auth";

/**
 * 회원(본인) 관련 API
 *
 * Authorization: Bearer <token> 이 필요한 요청만 모읍니다.
 */

/** 토큰이 있으면 Authorization 헤더 객체를 만듦 */
function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * PATCH /members/me — 본인 프로필 부분 수정
 * 보낸 필드만 서버에서 업데이트됩니다.
 */
export function updateMyProfile(
  payload: ProfileUpdateRequest,
): Promise<MeResponse> {
  return apiRequest<MeResponse>("/members/me", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH /members/me/password — 본인 비밀번호 변경
 * 현재 비밀번호가 맞아야 새 비밀번호로 바뀝니다.
 */
export function changeMyPassword(
  payload: PasswordChangeRequest,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/members/me/password", {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}
