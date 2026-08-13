import type { ApiErrorBody } from "../types/auth";

/**
 * 백엔드 기본 주소.
 * Vite에서는 VITE_ 로 시작하는 환경 변수만 프론트에서 읽을 수 있습니다.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

/**
 * FastAPI 공통 요청 헬퍼.
 * - JSON body 전송
 * - 실패 시 detail / errors 메시지를 Error 로 던짐
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  const headers = new Headers(options.headers);

  // FormData는 브라우저가 multipart boundary를 포함한 Content-Type을 자동 설정해야 합니다.
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "백엔드 서버에 연결할 수 없습니다. uvicorn이 실행 중인지 확인하세요. (http://127.0.0.1:8000)",
    );
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error("서버 응답을 해석할 수 없습니다.");
    }
  }

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    let message = "요청에 실패했습니다.";

    if (typeof body?.detail === "string") {
      message = body.detail;
    } else if (body?.errors?.length) {
      message = body.errors.map((e) => e.message).join(", ");
    }

    throw new Error(message);
  }

  return data as T;
}
