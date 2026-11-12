import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  fetchActivity,
  fetchMyMembership,
  joinActivity,
  leaveActivity,
} from "../api/activities";
import { getAccessToken } from "../api/auth";
import { ActivityMembersManager } from "../components/ActivityMembersManager";
import { Loading } from "../components/Loading";
import type {
  Activity,
  ActivityKind,
  MyActivityMembership,
} from "../types/activities";
import { formatDateTime } from "../utils/date";
import { statusLabels } from "./ActivityListPage";

type ActivityDetailPageProps = {
  kind: ActivityKind;
};

/** 프로젝트·스터디가 공유하는 공개 상세 페이지 (가입 신청 + 리더·관리자 멤버 관리) */
export function ActivityDetailPage({ kind }: ActivityDetailPageProps) {
  const { publicId } = useParams<{ publicId: string }>();
  const location = useLocation();
  const [item, setItem] = useState<Activity | null>(null);
  const [mine, setMine] = useState<MyActivityMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinBusy, setJoinBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const label = kind === "projects" ? "프로젝트" : "스터디";
  const leaderLabel = kind === "projects" ? "프로젝트장" : "스터디장";
  const loggedIn = Boolean(getAccessToken());

  const reloadActivity = useCallback(async () => {
    if (!publicId) return;
    setItem(await fetchActivity(kind, publicId));
  }, [kind, publicId]);

  useEffect(() => {
    if (!publicId) {
      setError(`${label} 식별자가 없습니다.`);
      setLoading(false);
      return;
    }

    const activityId = publicId;
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const data = await fetchActivity(kind, activityId);
        if (cancelled) return;
        setItem(data);
        if (getAccessToken()) {
          // 로그인 상태만 내 가입 상태를 확인합니다. 실패해도 상세는 보여줍니다.
          const my = await fetchMyMembership(kind, activityId).catch(() => null);
          if (!cancelled) setMine(my);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : `${label}를 불러오지 못했습니다.`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, label, publicId]);

  async function handleJoin() {
    if (!publicId) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      setMine(await joinActivity(kind, publicId));
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "가입 신청에 실패했습니다.");
    } finally {
      setJoinBusy(false);
    }
  }

  async function handleLeave() {
    if (!publicId || !mine) return;
    const question =
      mine.status === "pending"
        ? "가입 신청을 취소할까요?"
        : `이 ${label}에서 나갈까요?`;
    if (!window.confirm(question)) return;
    setJoinBusy(true);
    setJoinError(null);
    try {
      setMine(await leaveActivity(kind, publicId));
      await reloadActivity();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setJoinBusy(false);
    }
  }

  const canJoin = Boolean(item?.is_recruiting && item.status !== "completed");

  function renderJoinPanel() {
    if (!item) return null;

    if (!loggedIn) {
      return canJoin ? (
        <div className="join-panel">
          <div>
            <strong>멤버 모집 중</strong>
            <p>로그인한 동아리 회원은 가입 신청할 수 있습니다.</p>
          </div>
          <Link
            to="/login"
            state={{ from: location.pathname }}
            className="btn-primary-link btn-inline"
          >
            로그인하고 신청하기
          </Link>
        </div>
      ) : null;
    }

    if (!mine) return null;

    if (mine.status === "approved") {
      return (
        <div className="join-panel is-joined">
          <div>
            <strong>
              참여 중{mine.role === "leader" ? ` · ${leaderLabel}` : ""}
            </strong>
            <p>이 {label}의 멤버입니다.</p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-inline"
            disabled={joinBusy}
            onClick={handleLeave}
          >
            나가기
          </button>
        </div>
      );
    }

    if (mine.status === "pending") {
      return (
        <div className="join-panel is-pending">
          <div>
            <strong>가입 신청 완료 · 승인 대기 중</strong>
            <p>{leaderLabel} 또는 관리자가 승인하면 멤버로 표시됩니다.</p>
          </div>
          <button
            type="button"
            className="btn-secondary btn-inline"
            disabled={joinBusy}
            onClick={handleLeave}
          >
            신청 취소
          </button>
        </div>
      );
    }

    return canJoin ? (
      <div className="join-panel">
        <div>
          <strong>멤버 모집 중</strong>
          <p>가입 신청하면 {leaderLabel}의 승인 후 참여할 수 있습니다.</p>
        </div>
        <button
          type="button"
          className="btn-inline join-panel-button"
          disabled={joinBusy}
          onClick={handleJoin}
        >
          {joinBusy ? "신청 중..." : "가입 신청"}
        </button>
      </div>
    ) : (
      <p className="muted join-closed">지금은 멤버를 모집하고 있지 않습니다.</p>
    );
  }

  return (
    <main className="page">
      <article className="card card-wide card-read">
        {loading ? <Loading /> : null}
        {error ? <p className="error">{error}</p> : null}

        {item ? (
          <>
            <header className="activity-detail-header">
              <div>
                <div className="activity-detail-badges">
                  <span className={`status-badge status-${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                  {canJoin ? <span className="status-badge status-recruiting">모집 중</span> : null}
                </div>
                <h1>{item.title}</h1>
              </div>
              <time dateTime={item.created_at}>
                등록 {formatDateTime(item.created_at)}
              </time>
            </header>

            {renderJoinPanel()}
            {joinError ? <p className="error">{joinError}</p> : null}

            <section className="activity-detail-section">
              <h2>소개</h2>
              <div className="notice-content">{item.description}</div>
            </section>

            <section className="activity-detail-section">
              <h2>기술 스택 / 주제</h2>
              <p>{item.tech_stack || "등록된 내용이 없습니다."}</p>
            </section>

            {item.meeting_schedule || item.location ? (
              <section className="activity-detail-section">
                <h2>모임 정보</h2>
                <p>
                  {[item.meeting_schedule, item.location].filter(Boolean).join(" · ")}
                </p>
              </section>
            ) : null}

            <section className="activity-detail-section">
              <h2>{kind === "projects" ? "프로젝트 팀" : "스터디 멤버"}</h2>
              {item.memberships.length > 0 ? (
                <ul className="activity-member-list">
                  {item.memberships.map((membership) => (
                    <li key={membership.member.public_id}>
                      <strong>{membership.member.name}</strong>
                      <span>
                        {membership.role === "leader" ? leaderLabel : "멤버"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">등록된 멤버가 없습니다.</p>
              )}
            </section>

            {mine?.can_manage && publicId ? (
              <ActivityMembersManager
                kind={kind}
                activityId={publicId}
                canAppoint={mine.can_appoint}
                onChanged={() => void reloadActivity()}
              />
            ) : null}
          </>
        ) : null}

        <p className="switch-link">
          <Link to={`/${kind}`}>{label} 목록으로 돌아가기</Link>
        </p>
      </article>
    </main>
  );
}
