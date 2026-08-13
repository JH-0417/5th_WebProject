import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchNotice } from "../api/notices";
import type { Notice } from "../types/notices";
import { formatDateTime } from "../utils/date";

/** 공개 공지사항 상세 페이지 */
export function NoticeDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const location = useLocation();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fromCalendar =
    (location.state as { from?: string } | null)?.from === "/calendar";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!publicId) {
        setError("공지사항 식별자가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchNotice(publicId);
        if (!cancelled) setNotice(data);
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
  }, [publicId]);

  return (
    <main className="page">
      <article className="card card-wide">
        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {notice ? (
          <>
            <header className="notice-detail-header">
              <div className="notice-list-title">
                {notice.is_pinned ? <span className="badge">고정</span> : null}
                <h1>{notice.title}</h1>
              </div>
              <time dateTime={notice.created_at}>
                작성 {formatDateTime(notice.created_at)}
              </time>
            </header>

            {notice.event_start ? (
              <section className="event-box" aria-label="일정 정보">
                <strong>일정 안내</strong>
                <p>
                  시작: {formatDateTime(notice.event_start)}
                  <br />
                  {notice.event_end
                    ? `종료: ${formatDateTime(notice.event_end)}`
                    : null}
                  {notice.location ? (
                    <>
                      <br />
                      장소: {notice.location}
                    </>
                  ) : null}
                </p>
              </section>
            ) : null}

            <div className="notice-content">{notice.content}</div>
          </>
        ) : null}

        <p className="switch-link">
          <Link to={fromCalendar ? "/calendar" : "/notices"}>
            {fromCalendar ? "캘린더로 돌아가기" : "목록으로 돌아가기"}
          </Link>
        </p>
      </article>
    </main>
  );
}
