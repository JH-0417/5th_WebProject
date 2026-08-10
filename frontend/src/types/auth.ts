/** 로그인 API 요청/응답 타입 (백엔드 schemas 와 맞춤) */

export type LoginRequest = {
  login_id: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type ApiErrorBody = {
  detail?: string | { msg?: string }[];
  errors?: { field: string; message: string }[];
};
