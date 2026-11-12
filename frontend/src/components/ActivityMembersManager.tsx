import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  addActivityMember,
  fetchActivityMembers,
  removeActivityMember,
  updateActivityMember,
} from "../api/activities";
import { fetchMembers } from "../api/members";
import type {
  ActivityKind,
  ActivityMembershipManage,
  ActivityRole,
} from "../types/activities";
import type { MemberCard } from "../types/members";
import { Loading } from "./Loading";

type ActivityMembersManagerProps = {
  kind: ActivityKind;
  activityId: string;
  /** 사이트 관리자만 리더 임명·해제 가능 */
  canAppoint: boolean;
  /** 멤버 구성이 바뀌면 상세 화면의 공개 멤버 목록을 다시 불러오도록 알림 */
  onChanged: () => void;
};

/** 프로젝트·스터디 리더와 관리자가 쓰는 멤버 관리 패널 */
export function ActivityMembersManager({
  kind,
  activityId,
  canAppoint,
  onChanged,
}: ActivityMembersManagerProps) {
  const leaderLabel = kind === "projects" ? "프로젝트장" : "스터디장";
  const [memberships, setMemberships] = useState<ActivityMembershipManage[]>([]);
  const [clubMembers, setClubMembers] = useState<MemberCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedRole, setSelectedRole] = useState<ActivityRole>("member");

  async function loadMemberships() {
    const data = await fetchActivityMembers(kind, activityId);
    setMemberships(data.items);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([fetchActivityMembers(kind, activityId), fetchMembers()])
      .then(([membershipData, memberData]) => {
        if (cancelled) return;
        setMemberships(membershipData.items);
        setClubMembers(memberData.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "멤버를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind, activityId]);

  const pending = memberships.filter((m) => m.status === "pending");
  const approved = memberships.filter((m) => m.status === "approved");

  // 이미 멤버이거나 신청한 회원은 추가 목록에서 뺍니다.
  const addableMembers = useMemo(() => {
    const taken = new Set(memberships.map((m) => m.member.public_id));
    return clubMembers
      .filter((member) => !taken.has(member.public_id))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [clubMembers, memberships]);

  async function run(memberId: string, action: () => Promise<string>) {
    setBusyId(memberId);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      setMessage(result);
      await loadMemberships();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  function approve(m: ActivityMembershipManage) {
    void run(m.member.public_id, async () => {
      await updateActivityMember(kind, activityId, m.member.public_id, {
        status: "approved",
      });
      return `${m.member.name} 님의 가입을 승인했습니다.`;
    });
  }

  function remove(m: ActivityMembershipManage) {
    const isPending = m.status === "pending";
    const question = isPending
      ? `${m.member.name} 님의 가입 신청을 거절할까요?`
      : `${m.member.name} 님을 멤버에서 제외할까요?`;
    if (!window.confirm(question)) return;
    void run(m.member.public_id, async () => {
      const result = await removeActivityMember(kind, activityId, m.member.public_id);
      return result.message;
    });
  }

  function toggleLeader(m: ActivityMembershipManage) {
    const nextRole: ActivityRole = m.role === "leader" ? "member" : "leader";
    void run(m.member.public_id, async () => {
      await updateActivityMember(kind, activityId, m.member.public_id, {
        role: nextRole,
      });
      return nextRole === "leader"
        ? `${m.member.name} 님을 ${leaderLabel}으로 임명했습니다.`
        : `${m.member.name} 님의 ${leaderLabel} 역할을 해제했습니다.`;
    });
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = addableMembers.find((m) => m.public_id === selectedMemberId);
    if (!target) return;
    void run(target.public_id, async () => {
      await addActivityMember(kind, activityId, target.public_id, selectedRole);
      setSelectedMemberId("");
      setSelectedRole("member");
      return `${target.name} 님을 추가했습니다.`;
    });
  }

  return (
    <section className="member-manager" aria-label="멤버 관리">
      <header className="member-manager-header">
        <div>
          <h2>멤버 관리</h2>
          <p>
            가입 신청을 승인하고 인원을 추가합니다.
            {canAppoint ? ` ${leaderLabel} 임명은 관리자만 할 수 있습니다.` : null}
          </p>
        </div>
        {pending.length > 0 ? (
          <span className="member-manager-count">신청 {pending.length}</span>
        ) : null}
      </header>

      {loading ? <Loading label="멤버를 불러오는 중" /> : null}
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      {!loading ? (
        <>
          <h3 className="member-manager-subtitle">가입 신청</h3>
          {pending.length === 0 ? (
            <p className="muted">대기 중인 가입 신청이 없습니다.</p>
          ) : (
            <ul className="member-manager-list">
              {pending.map((m) => (
                <li key={m.member.public_id} className="is-pending">
                  <div className="member-manager-person">
                    <span className="member-manager-avatar">{m.member.name.slice(0, 1)}</span>
                    <div>
                      <strong>{m.member.name}</strong>
                      <small>
                        {m.member.department} · {m.member.grade}학년
                      </small>
                    </div>
                  </div>
                  <div className="member-manager-actions">
                    <button
                      type="button"
                      className="btn-small btn-approve-soft"
                      disabled={busyId === m.member.public_id}
                      onClick={() => approve(m)}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className="btn-small btn-delete"
                      disabled={busyId === m.member.public_id}
                      onClick={() => remove(m)}
                    >
                      거절
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3 className="member-manager-subtitle">멤버 {approved.length}명</h3>
          <ul className="member-manager-list">
            {approved.map((m) => (
              <li key={m.member.public_id}>
                <div className="member-manager-person">
                  <span className="member-manager-avatar">{m.member.name.slice(0, 1)}</span>
                  <div>
                    <strong>
                      {m.member.name}
                      {m.role === "leader" ? (
                        <span className="member-manager-role">{leaderLabel}</span>
                      ) : null}
                    </strong>
                    <small>
                      {m.member.department} · {m.member.grade}학년
                    </small>
                  </div>
                </div>
                <div className="member-manager-actions">
                  {canAppoint ? (
                    <button
                      type="button"
                      className="btn-small btn-edit"
                      disabled={busyId === m.member.public_id}
                      onClick={() => toggleLeader(m)}
                    >
                      {m.role === "leader" ? `${leaderLabel} 해제` : `${leaderLabel} 임명`}
                    </button>
                  ) : null}
                  {canAppoint || m.role !== "leader" ? (
                    <button
                      type="button"
                      className="btn-small btn-delete"
                      disabled={busyId === m.member.public_id}
                      onClick={() => remove(m)}
                    >
                      제외
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <form className="member-manager-add" onSubmit={handleAdd}>
            <label className="field">
              <span>인원 추가</span>
              <select
                value={selectedMemberId}
                onChange={(event) => setSelectedMemberId(event.target.value)}
              >
                <option value="">
                  {addableMembers.length ? "추가할 회원 선택" : "추가할 수 있는 회원이 없습니다"}
                </option>
                {addableMembers.map((member) => (
                  <option key={member.public_id} value={member.public_id}>
                    {member.name} · {member.department} {member.grade}학년
                  </option>
                ))}
              </select>
            </label>
            {canAppoint ? (
              <label className="field">
                <span>역할</span>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as ActivityRole)}
                >
                  <option value="member">멤버</option>
                  <option value="leader">{leaderLabel}</option>
                </select>
              </label>
            ) : null}
            <button
              type="submit"
              disabled={!selectedMemberId || busyId !== null}
            >
              추가
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}
