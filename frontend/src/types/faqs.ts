/** 백엔드 FaqResponse와 같은 FAQ 타입 */
export type Faq = {
  public_id: string;
  question: string;
  answer: string;
  created_at: string;
};

/** GET /faqs 응답 */
export type FaqListResponse = {
  total: number;
  items: Faq[];
};

/** POST /admin/faqs 요청 */
export type FaqCreateRequest = {
  question: string;
  answer: string;
};
