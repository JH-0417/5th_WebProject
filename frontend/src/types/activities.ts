/** 프로젝트와 스터디가 공유하는 API 응답 타입 */
export type Activity = {
  public_id: string;
  title: string;
  description: string;
  tech_stack: string | null;
  status: "planned" | "in_progress" | "completed";
  category: "project" | "study";
  created_at: string;
  updated_at: string;
};

export type ActivityListResponse = {
  total: number;
  items: Activity[];
};

export type ActivityKind = "projects" | "studies";
