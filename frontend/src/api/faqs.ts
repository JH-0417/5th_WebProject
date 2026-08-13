import { apiRequest } from "./client";
import type { FaqListResponse } from "../types/faqs";

/** GET /faqs — 공개 FAQ 목록 */
export function fetchFaqs(): Promise<FaqListResponse> {
  return apiRequest<FaqListResponse>("/faqs");
}
