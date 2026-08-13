import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveMember,
  fetchAdminMembers,
  rejectMember,
} from "../api/admin";
import type {
  AdminMember,
  ClubPosition,
  JoinStatusFilter,
} from "../types/admin";

const POSITION_LABELS: Record<ClubPosition, string> = {
  president: "회장",
  vice_president: "부회장",
  treasurer: "총무",
  officer: "임원",
  member: "일반 회원",
};

/**
 * 관리자: 가입 신청 목록 + 승인/탈락
 */
export function AdminMembersPage() {
  const [filter, setFilter] = useState<JoinStatusFilter>("pending");
  const [items, setItems] = useState<AdminMember[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminMembers(filter);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "목록을 불러오지 못했습니다.";
      setError(text);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(publicId: string) {
    setBusyId(publicId);
    setMessage(null);
    setError(null);
    try {
      const result = await approveMember(publicId);
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(publicId: string) {
    setBusyId(publicId);
    setMessage(null);
    setError(null);
    try {
      const result = await rejectMember(publicId);
      setMessage(result.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "탈락 처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>가입 신청 관리</h1>
        <p className="subtitle">대기 중인 가입 신청을 승인하거나 탈락 처리합니다.</p>

        <div className="filter-row" role="tablist" aria-label="가입 상태 필터">
          {(
            [
              ["pending", "대기"],
              ["approved", "승인"],
              ["rejected", "탈락"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value ? "filter-btn filter-btn-active" : "filter-btn"
              }
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}

        {!loading && total === 0 ? (
          <p className="muted">해당 상태의 회원이 없습니다.</p>
        ) : null}

        <ul className="applicant-list">
          {items.map((member) => {
            return (
              <li key={member.public_id} className="applicant-card">
                <div className="applicant-header">
                  <strong>
                    {member.name} ({member.student_id})
                  </strong>
                  <div className="member-badges">
                    {member.system_role === "admin" ? (
                      <span className="badge">관리자</span>
                    ) : null}
                    <span className="badge">
                      {POSITION_LABELS[member.club_position]}
                    </span>
                    <span className="badge">{member.join_status}</span>
                  </div>
                </div>
                <dl className="info-list compact">
                  <div>
                    <dt>학과</dt>
                    <dd>
                      {member.department} / {member.grade}학년
                    </dd>
                  </div>
                  <div>
                    <dt>이메일</dt>
                    <dd>{member.email}</dd>
                  </div>
                  <div>
                    <dt>지원 사유</dt>
                    <dd>{member.apply_reason || "-"}</dd>
                  </div>
                  <div>
                    <dt>희망 활동</dt>
                    <dd>{member.desired_activity || "-"}</dd>
                  </div>
                </dl>

                {member.join_status === "pending" ? (
                  <div className="button-row horizontal">
                    <button
                      type="button"
                      className="btn-approve"
                      disabled={busyId === member.public_id}
                      onClick={() => void handleApprove(member.public_id)}
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      className="btn-reject"
                      disabled={busyId === member.public_id}
                      onClick={() => void handleReject(member.public_id)}
                    >
                      탈락
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="switch-link">
          <Link to="/dashboard">대시보드로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
