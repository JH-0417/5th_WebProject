/** 백엔드 CalendarEventResponse와 같은 일정 타입 (공지사항과 별도 관리) */
export type CalendarEvent = {
  public_id: string;
  title: string;
  description: string | null;
  event_start: string;
  event_end: string | null;
  location: string | null;
};

/** GET /calendar 응답 */
export type CalendarListResponse = {
  total: number;
  items: CalendarEvent[];
};

/** POST /admin/calendar 요청 */
export type CalendarEventCreateRequest = {
  title: string;
  description: string | null;
  event_start: string;
  event_end: string | null;
  location: string | null;
};

/** PATCH /admin/calendar/{public_id} 요청 */
export type CalendarEventUpdateRequest = Partial<CalendarEventCreateRequest>;
