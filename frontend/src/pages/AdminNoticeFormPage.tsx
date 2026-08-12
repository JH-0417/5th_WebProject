import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createNotice, updateNotice } from "../api/admin";
import { fetchNotice } from "../api/notices";

/** ISO 날짜를 datetime-local input 형식(YYYY-MM-DDTHH:mm)으로 변환 */
function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** datetime-local 값을 API용 ISO 문자열로 변환 */
function toIsoOrNull(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** 관리자 공지 작성·수정 공용 폼 */
export function AdminNoticeFormPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(publicId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;
    const noticeId = publicId;
    let cancelled = false;

    async function loadNotice() {
      try {
        const notice = await fetchNotice(noticeId);
        if (cancelled) return;
        setTitle(notice.title);
        setContent(notice.content);
        setEventStart(toDateTimeLocal(notice.event_start));
        setEventEnd(toDateTimeLocal(notice.event_end));
        setEventLocation(notice.location ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "공지를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotice();
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (eventEnd && !eventStart) {
      setError("종료 시간을 입력하려면 시작 시간도 입력해야 합니다.");
      return;
    }
    if (eventStart && eventEnd && new Date(eventEnd) < new Date(eventStart)) {
      setError("종료 시간은 시작 시간보다 빠를 수 없습니다.");
      return;
    }

    setSaving(true);
    const payload = {
      title: title.trim(),
      content: content.trim(),
      event_start: toIsoOrNull(eventStart),
      event_end: toIsoOrNull(eventEnd),
      location: eventLocation.trim() || null,
    };

    try {
      const saved =
        isEdit && publicId
          ? await updateNotice(publicId, payload)
          : await createNotice(payload);
      navigate(`/notices/${saved.public_id}`, { replace: true });
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
        <h1>{isEdit ? "공지사항 수정" : "새 공지 작성"}</h1>
        <p className="subtitle">
          일정 공지가 아니라면 시간과 장소는 비워 두세요.
        </p>

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
            <span>내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={10}
            />
          </label>

          <div className="form-grid-two">
            <label className="field">
              <span>일정 시작 (선택)</span>
              <input
                type="datetime-local"
                value={eventStart}
                onChange={(event) => setEventStart(event.target.value)}
              />
            </label>
            <label className="field">
              <span>일정 종료 (선택)</span>
              <input
                type="datetime-local"
                value={eventEnd}
                onChange={(event) => setEventEnd(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>장소 (선택)</span>
            <input
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
              maxLength={200}
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" disabled={saving}>
            {saving ? "저장 중..." : isEdit ? "수정 저장" : "공지 등록"}
          </button>
        </form>

        <p className="switch-link">
          <Link to="/admin/notices">관리 목록으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
