import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchNotices } from "../api/notices";
import type { Notice } from "../types/notices";
import { formatDateTime } from "../utils/date";

/** 공개 공지사항 목록 페이지 */
export function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchNotices();
        if (!cancelled) setNotices(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "공지사항을 불러오지 못했습니다.",
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
  }, []);

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>공지사항</h1>
        <p className="subtitle">동아리의 새로운 소식을 확인하세요.</p>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && notices.length === 0 ? (
          <p className="muted">등록된 공지사항이 없습니다.</p>
        ) : null}

        <ul className="notice-list">
          {notices.map((notice) => (
            <li key={notice.public_id}>
              <Link
                to={`/notices/${notice.public_id}`}
                className="notice-list-item"
              >
                <div className="notice-list-title">
                  {notice.is_pinned ? <span className="badge">고정</span> : null}
                  <strong>{notice.title}</strong>
                </div>
                <time dateTime={notice.created_at}>
                  {formatDateTime(notice.created_at)}
                </time>
                {notice.event_start ? (
                  <span className="notice-event-preview">
                    일정 · {formatDateTime(notice.event_start)}
                    {notice.location ? ` · ${notice.location}` : ""}
                  </span>
                ) : null}
              </Link>
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
