import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchActivity } from "../api/activities";
import type { Activity, ActivityKind } from "../types/activities";
import { formatDateTime } from "../utils/date";
import { statusLabels } from "./ActivityListPage";

type ActivityDetailPageProps = {
  kind: ActivityKind;
};

/** 프로젝트·스터디가 공유하는 공개 상세 페이지 */
export function ActivityDetailPage({ kind }: ActivityDetailPageProps) {
  const { publicId } = useParams<{ publicId: string }>();
  const [item, setItem] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const label = kind === "projects" ? "프로젝트" : "스터디";

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
        if (!cancelled) setItem(data);
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

  return (
    <main className="page">
      <article className="card card-wide">
        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {item ? (
          <>
            <header className="activity-detail-header">
              <div>
                <span className={`status-badge status-${item.status}`}>
                  {statusLabels[item.status]}
                </span>
                <h1>{item.title}</h1>
              </div>
              <time dateTime={item.created_at}>
                등록 {formatDateTime(item.created_at)}
              </time>
            </header>

            <section className="activity-detail-section">
              <h2>소개</h2>
              <div className="notice-content">{item.description}</div>
            </section>

            <section className="activity-detail-section">
              <h2>기술 스택 / 주제</h2>
              <p>{item.tech_stack || "등록된 내용이 없습니다."}</p>
            </section>
          </>
        ) : null}

        <p className="switch-link">
          <Link to={`/${kind}`}>{label} 목록으로 돌아가기</Link>
        </p>
      </article>
    </main>
  );
}
