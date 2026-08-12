import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchActivities } from "../api/activities";
import type { Activity, ActivityKind } from "../types/activities";
import { formatDateTime } from "../utils/date";

type ActivityListPageProps = {
  kind: ActivityKind;
};

const labels = {
  projects: { title: "프로젝트", singular: "프로젝트" },
  studies: { title: "스터디", singular: "스터디" },
} as const;

export const statusLabels: Record<Activity["status"], string> = {
  planned: "예정",
  in_progress: "진행 중",
  completed: "완료",
};

/** 프로젝트·스터디가 공유하는 공개 목록 페이지 */
export function ActivityListPage({ kind }: ActivityListPageProps) {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const label = labels[kind];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const data = await fetchActivities(kind);
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : `${label.title}를 불러오지 못했습니다.`,
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
  }, [kind, label.title]);

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>{label.title}</h1>
        <p className="subtitle">
          동아리에서 운영하는 {label.title}를 확인하세요.
        </p>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="muted">등록된 {label.singular}가 없습니다.</p>
        ) : null}

        <ul className="activity-grid">
          {items.map((item) => (
            <li key={item.public_id}>
              <Link
                to={`/${kind}/${item.public_id}`}
                className="activity-card"
              >
                <div className="activity-card-header">
                  <strong>{item.title}</strong>
                  <span className={`status-badge status-${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <p className="activity-description">{item.description}</p>
                <div className="activity-meta">
                  <span>{item.tech_stack || "기술 스택 미등록"}</span>
                  <time dateTime={item.created_at}>
                    {formatDateTime(item.created_at)}
                  </time>
                </div>
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
