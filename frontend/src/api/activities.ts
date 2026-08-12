import { apiRequest } from "./client";
import type {
  Activity,
  ActivityKind,
  ActivityListResponse,
} from "../types/activities";

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
  return apiRequest<Activity>(
    `/${kind}/${encodeURIComponent(publicId)}`,
  );
}
