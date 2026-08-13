export type SystemRole = "admin" | "member";
export type ClubPosition =
  | "president"
  | "vice_president"
  | "treasurer"
  | "officer"
  | "member";

export type MemberCard = {
  public_id: string;
  name: string;
  department: string;
  grade: number;
  email: string;
  system_role: SystemRole;
  club_position: ClubPosition;
  student_id?: string;
  masked_student_id?: string;
  is_approved?: boolean;
  join_status?: string;
  github_username?: string | null;
  bio?: string | null;
  tech_stack?: string | null;
};

export type MemberListResponse = {
  total: number;
  items: MemberCard[];
};
