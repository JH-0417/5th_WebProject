/**
 * 관리자 API 관련 타입 (MemberAdminResponse 와 맞춤)
 */

export type AdminMember = {
  public_id: string;
  name: string;
  student_id: string;
  department: string;
  grade: number;
  email: string;
  role: string;
  is_approved: boolean;
  join_status: string; // pending / approved / rejected
  apply_reason: string;
  desired_activity: string;
  github_username?: string | null;
  bio?: string | null;
  tech_stack?: string | null;
};

export type AdminMemberListResponse = {
  total: number;
  items: AdminMember[];
};

export type AdminJoinActionResponse = {
  message: string;
  member: AdminMember;
};

export type JoinStatusFilter = "pending" | "approved" | "rejected";
