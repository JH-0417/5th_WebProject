import { apiRequest } from "./client";
import type { Recruitment } from "../types/recruitment";

/** GET /recruitment — 공개 모집 상태 (지원하기 버튼 노출 여부 판단) */
export function fetchRecruitment(): Promise<Recruitment> {
  return apiRequest<Recruitment>("/recruitment");
}
