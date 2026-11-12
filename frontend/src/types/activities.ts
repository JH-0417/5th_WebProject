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
  is_recruiting: boolean;
  meeting_schedule?: string | null;
  location?: string | null;
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
  is_recruiting: boolean;
};

export type ActivityRole = "leader" | "member";

/** 멤버 관리 화면용 멤버십 (가입 신청 대기 포함) */
export type ActivityMembershipManage = {
  role: ActivityRole;
  status: "pending" | "approved";
  created_at: string;
  member: {
    public_id: string;
    name: string;
    department: string;
    grade: number;
  };
};

export type ActivityMembershipListResponse = {
  total: number;
  items: ActivityMembershipManage[];
};

/** 로그인한 회원 기준 이 활동에서의 상태 */
export type MyActivityMembership = {
  status: "none" | "pending" | "approved";
  role: ActivityRole | null;
  can_manage: boolean;
  can_appoint: boolean;
};
