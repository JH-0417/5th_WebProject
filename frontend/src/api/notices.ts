import { apiRequest } from "./client";
import type { Notice, NoticeListResponse } from "../types/notices";

/** GET /notices — 공개 공지사항 목록 */
export function fetchNotices(): Promise<NoticeListResponse> {
  return apiRequest<NoticeListResponse>("/notices");
}

/** GET /notices/{public_id} — 공개 공지사항 상세 */
export function fetchNotice(publicId: string): Promise<Notice> {
  return apiRequest<Notice>(`/notices/${encodeURIComponent(publicId)}`);
}
