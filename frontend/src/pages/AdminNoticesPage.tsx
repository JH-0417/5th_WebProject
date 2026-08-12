import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteNotice } from "../api/admin";
import { fetchNotices } from "../api/notices";
import type { Notice } from "../types/notices";
import { formatDateTime } from "../utils/date";

/** 관리자 공지사항 목록 및 관리 페이지 */
export function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadNotices() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotices();
      setNotices(data.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "공지사항을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotices();
  }, []);

  async function handleDelete(notice: Notice) {
    const confirmed = window.confirm(`"${notice.title}" 공지를 삭제할까요?`);
    if (!confirmed) return;

    setDeletingId(notice.public_id);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteNotice(notice.public_id);
      setMessage(result.message);
      await loadNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <div className="page-heading-row">
          <div>
            <h1>공지사항 관리</h1>
            <p className="subtitle">공지를 작성·수정·삭제합니다.</p>
          </div>
          <Link to="/admin/notices/new" className="btn-primary-link btn-inline">
            새 공지 작성
          </Link>
        </div>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        {!loading && notices.length === 0 ? (
          <p className="muted">등록된 공지사항이 없습니다.</p>
        ) : null}

        <ul className="admin-notice-list">
          {notices.map((notice) => (
            <li key={notice.public_id} className="admin-notice-item">
              <div>
                <strong>{notice.title}</strong>
                <p>
                  {formatDateTime(notice.created_at)}
                  {notice.event_start ? " · 일정 공지" : ""}
                </p>
              </div>
              <div className="admin-notice-actions">
                <Link
                  to={`/notices/${notice.public_id}`}
                  className="btn-small btn-view"
                >
                  보기
                </Link>
                <Link
                  to={`/admin/notices/${notice.public_id}/edit`}
                  className="btn-small btn-edit"
                >
                  수정
                </Link>
                <button
                  type="button"
                  className="btn-small btn-delete"
                  disabled={deletingId === notice.public_id}
                  onClick={() => void handleDelete(notice)}
                >
                  {deletingId === notice.public_id ? "삭제 중" : "삭제"}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
