/** 백엔드 CalendarEventResponse와 같은 일정 타입 */
export type CalendarEvent = {
  public_id: string;
  title: string;
  content: string;
  event_start: string;
  event_end: string | null;
  location: string | null;
};

/** GET /calendar 응답 */
export type CalendarListResponse = {
  total: number;
  items: CalendarEvent[];
};
