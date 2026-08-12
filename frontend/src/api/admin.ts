import { apiRequest } from "./client";
import { getAccessToken } from "./auth";
import type {
  AdminJoinActionResponse,
  AdminMemberListResponse,
  JoinStatusFilter,
} from "../types/admin";
import type {
  Notice,
  NoticeCreateRequest,
  NoticeUpdateRequest,
} from "../types/notices";
import type {
  Activity,
  ActivityKind,
  ActivityManageRequest,
} from "../types/activities";

/**
 * 관리자 API 모음
 * 모든 요청에 Authorization: Bearer <token> 필요 (role=admin)
 */

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * GET /admin/members?join_status=...
 * 가입 심사 상태별 회원 목록
 */
export function fetchAdminMembers(
  joinStatus?: JoinStatusFilter,
): Promise<AdminMemberListResponse> {
  const query = joinStatus
    ? `?join_status=${encodeURIComponent(joinStatus)}`
    : "";
  return apiRequest<AdminMemberListResponse>(`/admin/members${query}`, {
    method: "GET",
    headers: authHeaders(),
  });
}

/** PATCH /admin/members/{public_id}/approve */
export function approveMember(
  publicId: string,
): Promise<AdminJoinActionResponse> {
  return apiRequest<AdminJoinActionResponse>(
    `/admin/members/${publicId}/approve`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
  );
}

/** PATCH /admin/members/{public_id}/reject */
export function rejectMember(
  publicId: string,
): Promise<AdminJoinActionResponse> {
  return apiRequest<AdminJoinActionResponse>(
    `/admin/members/${publicId}/reject`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
  );
}

/** POST /admin/notices — 공지사항 작성 */
export function createNotice(payload: NoticeCreateRequest): Promise<Notice> {
  return apiRequest<Notice>("/admin/notices", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** PATCH /admin/notices/{public_id} — 공지사항 부분 수정 */
export function updateNotice(
  publicId: string,
  payload: NoticeUpdateRequest,
): Promise<Notice> {
  return apiRequest<Notice>(
    `/admin/notices/${encodeURIComponent(publicId)}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
  );
}

/** DELETE /admin/notices/{public_id} — 공지사항 삭제 */
export function deleteNotice(publicId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/admin/notices/${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );
}

/** POST /admin/projects 또는 /admin/studies */
export function createActivity(
  kind: ActivityKind,
  payload: ActivityManageRequest,
): Promise<Activity> {
  return apiRequest<Activity>(`/admin/${kind}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** PATCH /admin/projects/{public_id} 또는 /admin/studies/{public_id} */
export function updateActivity(
  kind: ActivityKind,
  publicId: string,
  payload: ActivityManageRequest,
): Promise<Activity> {
  return apiRequest<Activity>(
    `/admin/${kind}/${encodeURIComponent(publicId)}`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    },
  );
}

/** DELETE /admin/projects/{public_id} 또는 /admin/studies/{public_id} */
export function deleteActivity(
  kind: ActivityKind,
  publicId: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `/admin/${kind}/${encodeURIComponent(publicId)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );
}
