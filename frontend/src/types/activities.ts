/** 프로젝트와 스터디가 공유하는 API 응답 타입 */
export type ActivityMembership = {
  role: "leader" | "member";
  member: {
    public_id: string;
    name: string;
  };
};

export type Activity = {
  public_id: string;
  title: string;
  description: string;
  tech_stack: string | null;
  status: "planned" | "in_progress" | "completed";
  category: "project" | "study";
  created_at: string;
  updated_at: string;
  memberships: ActivityMembership[];
};

export type ActivityListResponse = {
  total: number;
  items: Activity[];
};

export type ActivityKind = "projects" | "studies";

/** 관리자 프로젝트·스터디 작성/수정 요청 */
export type ActivityManageRequest = {
  title: string;
  description: string;
  tech_stack: string | null;
  status: Activity["status"];
};
