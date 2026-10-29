/** GET /recruitment, GET·PATCH /admin/recruitment 응답 */
export interface Recruitment {
  /** 가입 신청을 받는 중인지 */
  is_open: boolean;
  /** 모집 안내 문구 (없으면 null) */
  message: string | null;
  updated_at: string;
}

/** PATCH /admin/recruitment 요청 (보낸 필드만 수정, message 빈 문자열이면 지움) */
export interface RecruitmentUpdateRequest {
  is_open?: boolean;
  message?: string;
}
