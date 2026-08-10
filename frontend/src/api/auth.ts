import { apiRequest } from "./client";
import type { LoginRequest, LoginResponse } from "../types/auth";

/** POST /auth/login — 성공 시 JWT access_token 반환 */
export function login(payload: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

const TOKEN_KEY = "access_token";

export function saveAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
