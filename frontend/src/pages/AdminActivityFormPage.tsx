import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createActivity, updateActivity } from "../api/admin";
import { fetchActivity } from "../api/activities";
import type { Activity, ActivityKind } from "../types/activities";

type AdminActivityFormPageProps = {
  kind: ActivityKind;
};

/** 관리자 프로젝트·스터디 작성·수정 공용 폼 */
export function AdminActivityFormPage({
  kind,
}: AdminActivityFormPageProps) {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(publicId);
  const label = kind === "projects" ? "프로젝트" : "스터디";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [status, setStatus] = useState<Activity["status"]>("planned");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;
    const activityId = publicId;
    let cancelled = false;

    async function loadItem() {
      try {
        const item = await fetchActivity(kind, activityId);
        if (cancelled) return;
        setTitle(item.title);
        setDescription(item.description);
        setTechStack(item.tech_stack ?? "");
        setStatus(item.status);
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

    void loadItem();
    return () => {
      cancelled = true;
    };
  }, [kind, label, publicId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      tech_stack: techStack.trim() || null,
      status,
    };

    try {
      const saved =
        isEdit && publicId
          ? await updateActivity(kind, publicId, payload)
          : await createActivity(kind, payload);
      navigate(`/${kind}/${saved.public_id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="card card-wide">
          <p className="muted">불러오는 중...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>
          {isEdit ? `${label} 수정` : `새 ${label} 작성`}
        </h1>
        <p className="subtitle">{label}의 소개와 진행 상태를 입력하세요.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={100}
            />
          </label>

          <label className="field">
            <span>설명</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={8}
            />
          </label>

          <label className="field">
            <span>기술 스택 / 주제 (선택)</span>
            <input
              value={techStack}
              onChange={(event) => setTechStack(event.target.value)}
              placeholder="예: FastAPI, React"
            />
          </label>

          <label className="field">
            <span>진행 상태</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Activity["status"])
              }
            >
              <option value="planned">예정</option>
              <option value="in_progress">진행 중</option>
              <option value="completed">완료</option>
            </select>
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" disabled={saving}>
            {saving ? "저장 중..." : isEdit ? "수정 저장" : `${label} 등록`}
          </button>
        </form>

        <p className="switch-link">
          <Link to={`/admin/${kind}`}>관리 목록으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
