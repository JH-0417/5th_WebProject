import { apiRequest } from "./client";
import { getAccessToken } from "./auth";
import type {
  Activity,
  ActivityKind,
  ActivityListResponse,
  ActivityMembershipListResponse,
  ActivityMembershipManage,
  ActivityRole,
  MyActivityMembership,
} from "../types/activities";

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }
  return { Authorization: `Bearer ${token}` };
}

function activityPath(kind: ActivityKind, publicId: string): string {
  return `/${kind}/${encodeURIComponent(publicId)}`;
}

/** 프로젝트 또는 스터디 공개 목록 */
export function fetchActivities(
  kind: ActivityKind,
): Promise<ActivityListResponse> {
  return apiRequest<ActivityListResponse>(`/${kind}`);
}

/** 프로젝트 또는 스터디 공개 상세 */
export function fetchActivity(
  kind: ActivityKind,
  publicId: string,
): Promise<Activity> {
  return apiRequest<Activity>(activityPath(kind, publicId));
}

/** GET /{kind}/{id}/membership/me — 내 가입 상태와 관리 권한 */
export function fetchMyMembership(
  kind: ActivityKind,
  publicId: string,
): Promise<MyActivityMembership> {
  return apiRequest<MyActivityMembership>(
    `${activityPath(kind, publicId)}/membership/me`,
    { headers: authHeaders() },
  );
}

/** POST /{kind}/{id}/join — 가입 신청 */
export function joinActivity(
  kind: ActivityKind,
  publicId: string,
): Promise<MyActivityMembership> {
  return apiRequest<MyActivityMembership>(`${activityPath(kind, publicId)}/join`, {
    method: "POST",
    headers: authHeaders(),
  });
}

/** DELETE /{kind}/{id}/join — 가입 신청 취소 / 탈퇴 */
export function leaveActivity(
  kind: ActivityKind,
  publicId: string,
): Promise<MyActivityMembership> {
  return apiRequest<MyActivityMembership>(`${activityPath(kind, publicId)}/join`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

/** GET /{kind}/{id}/members — 가입 신청 대기 포함 멤버 목록 (리더·관리자) */
export function fetchActivityMembers(
  kind: ActivityKind,
  publicId: string,
): Promise<ActivityMembershipListResponse> {
  return apiRequest<ActivityMembershipListResponse>(
    `${activityPath(kind, publicId)}/members`,
    { headers: authHeaders() },
  );
}

/** POST /{kind}/{id}/members — 회원 직접 추가 */
export function addActivityMember(
  kind: ActivityKind,
  publicId: string,
  memberPublicId: string,
  role: ActivityRole = "member",
): Promise<ActivityMembershipManage> {
  return apiRequest<ActivityMembershipManage>(
    `${activityPath(kind, publicId)}/members`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ member_public_id: memberPublicId, role }),
    },
  );
}

/** PATCH /{kind}/{id}/members/{member} — 가입 승인 또는 리더 임명·해제 */
export function updateActivityMember(
  kind: ActivityKind,
  publicId: string,
  memberPublicId: string,
  payload: { role?: ActivityRole; status?: "approved" },
): Promise<ActivityMembershipManage> {
  return apiRequest<ActivityMembershipManage>(
    `${activityPath(kind, publicId)}/members/${encodeURIComponent(memberPublicId)}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
  );
}

/** DELETE /{kind}/{id}/members/{member} — 멤버 제외 / 가입 신청 거절 */
export function removeActivityMember(
  kind: ActivityKind,
  publicId: string,
  memberPublicId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `${activityPath(kind, publicId)}/members/${encodeURIComponent(memberPublicId)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );
}
