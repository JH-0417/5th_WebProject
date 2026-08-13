import { apiRequest } from "./client";
import type { CalendarListResponse } from "../types/calendar";

/** GET /calendar — 공개 일정 목록 */
export function fetchCalendarEvents(): Promise<CalendarListResponse> {
  return apiRequest<CalendarListResponse>("/calendar");
}
