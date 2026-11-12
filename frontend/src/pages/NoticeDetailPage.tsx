import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchNotice } from "../api/notices";
import type { Notice } from "../types/notices";
import { formatDateTime } from "../utils/date";
import { Loading } from "../components/Loading";

/** 공개 공지사항 상세 페이지 */
export function NoticeDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <article className="card card-wide card-read">
        {loading ? <Loading /> : null}
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

            {notice.image_url ? (
              <a
                className="notice-image"
                href={notice.image_url}
                target="_blank"
                rel="noreferrer"
                title="원본 이미지 보기"
              >
                <img src={notice.image_url} alt={`${notice.title} 첨부 이미지`} />
              </a>
            ) : null}

            <div className="notice-content">{notice.content}</div>
          </>
        ) : null}

        <p className="switch-link">
          <Link to="/notices">목록으로 돌아가기</Link>
        </p>
      </article>
    </main>
  );
}
