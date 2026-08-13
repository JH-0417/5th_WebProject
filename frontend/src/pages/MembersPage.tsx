import { useCallback, useEffect, useState } from "react";
import {
  updateMemberClubPosition,
  updateMemberSystemRole,
} from "../api/admin";
import { fetchMe, getAccessToken } from "../api/auth";
import { fetchMembers } from "../api/members";
import type {
  ClubPosition,
  MemberCard,
  SystemRole,
} from "../types/members";

type ColumnCount = 1 | 2 | 4;

const POSITION_LABELS: Record<ClubPosition, string> = {
  president: "회장",
  vice_president: "부회장",
  treasurer: "총무",
  officer: "임원",
  member: "회원",
};

const POSITION_ORDER: Record<ClubPosition, number> = {
  president: 0,
  vice_president: 1,
  treasurer: 2,
  officer: 3,
  member: 4,
};

function studentYear(member: MemberCard): string {
  const studentId = member.student_id ?? member.masked_student_id ?? "";
  const year = studentId.slice(0, 4);
  return /^\d{4}$/.test(year) ? `${year.slice(2)}학번` : "학번 미등록";
}

/** 임원진과 승인 회원을 명함 형태로 보여주는 멤버 소개 페이지 */
export function MembersPage() {
  const [items, setItems] = useState<MemberCard[]>([]);
  const [columns, setColumns] = useState<ColumnCount>(4);
  const [currentPublicId, setCurrentPublicId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [members, me] = await Promise.all([
        fetchMembers(),
        getAccessToken() ? fetchMe().catch(() => null) : Promise.resolve(null),
      ]);
      setItems(
        [...members.items].sort(
          (left, right) =>
            POSITION_ORDER[left.club_position] -
            POSITION_ORDER[right.club_position],
        ),
      );
      setCurrentPublicId(me?.public_id ?? null);
      setIsAdmin(me?.system_role === "admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "멤버 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSystemRoleChange(
    member: MemberCard,
    systemRole: SystemRole,
  ) {
    if (member.system_role === systemRole) {
      return;
    }
    if (member.public_id === currentPublicId && systemRole !== "admin") {
      setError("본인의 admin 권한은 스스로 변경할 수 없습니다.");
      return;
    }
    if (
      !window.confirm(
        `${member.name} 회원의 사이트 권한을 ${systemRole}(으)로 변경할까요?`,
      )
    ) {
      return;
    }

    setBusyId(member.public_id);
    setError(null);
    setMessage(null);
    try {
      const result = await updateMemberSystemRole(
        member.public_id,
        systemRole,
      );
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "역할 변경에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleClubPositionChange(
    member: MemberCard,
    clubPosition: ClubPosition,
  ) {
    if (member.club_position === clubPosition) {
      return;
    }
    if (
      !window.confirm(
        `${member.name} 회원의 직책을 ${POSITION_LABELS[clubPosition]}(으)로 변경할까요?`,
      )
    ) {
      return;
    }

    setBusyId(member.public_id);
    setError(null);
    setMessage(null);
    try {
      const result = await updateMemberClubPosition(
        member.public_id,
        clubPosition,
      );
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "직책 변경에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="members-page">
      <section className="members-hero">
        <p>OUR TEAM</p>
        <h1>멤버 소개</h1>
        <span>제 5세대를 함께 만들어가는 사람들을 소개합니다.</span>
      </section>

      <section className="members-content">
        <div className="members-toolbar">
          <div>
            <strong>{items.length}명의 멤버</strong>
            <span>
              {getAccessToken()
                ? "승인된 전체 회원을 표시합니다."
                : "비로그인 상태에서는 임원진만 표시합니다."}
            </span>
          </div>
          <div className="members-view-options" aria-label="카드 열 개수">
            {([1, 2, 4] as const).map((count) => (
              <button
                key={count}
                type="button"
                className={columns === count ? "active" : ""}
                aria-pressed={columns === count}
                onClick={() => setColumns(count)}
              >
                {count}개씩 보기
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="muted">멤버를 불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        {!loading && items.length === 0 ? (
          <p className="muted">표시할 멤버가 없습니다.</p>
        ) : null}

        <div className={`members-grid members-grid-${columns}`}>
          {items.map((member) => {
            const isSelf = member.public_id === currentPublicId;
            return (
              <article key={member.public_id} className="member-card">
                <div className="member-card-top">
                  <div className="member-avatar" aria-hidden="true">
                    {member.name.slice(0, 1)}
                  </div>
                  <div className="member-badges">
                    {member.system_role === "admin" ? (
                      <span className="member-role member-role-admin">
                        관리자
                      </span>
                    ) : null}
                    <span
                      className={`member-role member-position-${member.club_position}`}
                    >
                      {POSITION_LABELS[member.club_position]}
                    </span>
                  </div>
                </div>

                <h2>{member.name}</h2>
                <p className="member-meta">
                  {member.department} · {studentYear(member)}
                </p>
                <p className="member-bio">
                  {member.bio || "함께 배우고 성장하는 제 5세대 멤버입니다."}
                </p>

                {member.tech_stack ? (
                  <div className="member-tech-stack">
                    <strong>TECH</strong>
                    <span>{member.tech_stack}</span>
                  </div>
                ) : null}

                {member.github_username ? (
                  <a
                    className="member-github"
                    href={`https://github.com/${encodeURIComponent(member.github_username)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub 프로필 →
                  </a>
                ) : null}

                {isAdmin ? (
                  <div className="member-card-role-control">
                    <label className="field">
                      <span>사이트 권한</span>
                      <select
                        value={member.system_role}
                        disabled={
                          busyId === member.public_id ||
                          (isSelf && member.system_role === "admin")
                        }
                        onChange={(event) =>
                          void handleSystemRoleChange(
                            member,
                            event.target.value as SystemRole,
                          )
                        }
                      >
                        <option value="member">일반 권한</option>
                        <option value="admin">관리자 권한</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>동아리 직책</span>
                      <select
                        value={member.club_position}
                        disabled={busyId === member.public_id}
                        onChange={(event) =>
                          void handleClubPositionChange(
                            member,
                            event.target.value as ClubPosition,
                          )
                        }
                      >
                        <option value="member">일반 회원</option>
                        <option value="officer">임원</option>
                        <option value="treasurer">총무</option>
                        <option value="vice_president">부회장</option>
                        <option value="president">회장</option>
                      </select>
                    </label>
                    {isSelf && member.system_role === "admin" ? (
                      <small>본인 관리자 권한은 다른 관리자가 변경할 수 있습니다.</small>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
