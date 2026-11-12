/** 백엔드 NoticeResponse와 같은 공지사항 타입 */
export type Notice = {
  public_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  image_url: string | null;
  created_at: string;
  created_by_name?: string | null;
  updated_at: string;
};

/** GET /notices 응답 */
export type NoticeListResponse = {
  total: number;
  items: Notice[];
};

/** POST /admin/notices 요청 */
export type NoticeCreateRequest = {
  title: string;
  content: string;
};

/** PATCH /admin/notices/{public_id} 요청 */
export type NoticeUpdateRequest = Partial<NoticeCreateRequest>;
