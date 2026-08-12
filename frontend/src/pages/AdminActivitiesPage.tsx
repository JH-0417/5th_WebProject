import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteActivity } from "../api/admin";
import { fetchActivities } from "../api/activities";
import type { Activity, ActivityKind } from "../types/activities";
import { statusLabels } from "./ActivityListPage";

type AdminActivitiesPageProps = {
  kind: ActivityKind;
};

/** 관리자 프로젝트·스터디 목록 및 관리 페이지 */
export function AdminActivitiesPage({ kind }: AdminActivitiesPageProps) {
  const label = kind === "projects" ? "프로젝트" : "스터디";
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActivities(kind);
      setItems(data.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `${label}를 불러오지 못했습니다.`,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, [kind]);

  async function handleDelete(item: Activity) {
    if (!window.confirm(`"${item.title}" ${label}를 삭제할까요?`)) return;

    setDeletingId(item.public_id);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteActivity(kind, item.public_id);
      setMessage(result.message);
      await loadItems();
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
            <h1>{label} 관리</h1>
            <p className="subtitle">{label}를 작성·수정·삭제합니다.</p>
          </div>
          <Link
            to={`/admin/${kind}/new`}
            className="btn-primary-link btn-inline"
          >
            새 {label} 작성
          </Link>
        </div>

        <div className="filter-row">
          <Link
            to="/admin/projects"
            className={
              kind === "projects"
                ? "filter-btn filter-btn-active link-button"
                : "filter-btn link-button"
            }
          >
            프로젝트
          </Link>
          <Link
            to="/admin/studies"
            className={
              kind === "studies"
                ? "filter-btn filter-btn-active link-button"
                : "filter-btn link-button"
            }
          >
            스터디
          </Link>
        </div>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {message ? <p className="success">{message}</p> : null}
        {!loading && items.length === 0 ? (
          <p className="muted">등록된 {label}가 없습니다.</p>
        ) : null}

        <ul className="admin-notice-list">
          {items.map((item) => (
            <li key={item.public_id} className="admin-notice-item">
              <div>
                <strong>{item.title}</strong>
                <p>
                  {statusLabels[item.status]} ·{" "}
                  {item.tech_stack || "기술 스택 미등록"}
                </p>
              </div>
              <div className="admin-notice-actions">
                <Link
                  to={`/${kind}/${item.public_id}`}
                  className="btn-small btn-view"
                >
                  보기
                </Link>
                <Link
                  to={`/admin/${kind}/${item.public_id}/edit`}
                  className="btn-small btn-edit"
                >
                  수정
                </Link>
                <button
                  type="button"
                  className="btn-small btn-delete"
                  disabled={deletingId === item.public_id}
                  onClick={() => void handleDelete(item)}
                >
                  {deletingId === item.public_id ? "삭제 중" : "삭제"}
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
