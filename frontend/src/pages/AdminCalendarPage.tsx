import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "../api/admin";
import { fetchCalendarEvents } from "../api/calendar";
import { Loading } from "../components/Loading";
import type { CalendarEvent } from "../types/calendar";
import { formatDateTime } from "../utils/date";

/** ISO 날짜를 datetime-local input 형식(YYYY-MM-DDTHH:mm)으로 변환 */
function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoOrNull(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

const EMPTY_FORM = {
  title: "",
  start: "",
  end: "",
  location: "",
  description: "",
};

/** 관리자 일정 관리 페이지 (공지사항과 별도) */
export function AdminCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPast, setShowPast] = useState(false);

  async function loadEvents() {
    setLoading(true);
    try {
      const data = await fetchCalendarEvents();
      setEvents(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvents();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcomingEvents: CalendarEvent[] = [];
    const pastEvents: CalendarEvent[] = [];
    for (const event of events) {
      const end = new Date(event.event_end ?? event.event_start);
      (end >= startOfToday ? upcomingEvents : pastEvents).push(event);
    }
    return { upcoming: upcomingEvents, past: pastEvents.reverse() };
  }, [events]);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(event: CalendarEvent) {
    setEditingId(event.public_id);
    setForm({
      title: event.title,
      start: toDateTimeLocal(event.event_start),
      end: toDateTimeLocal(event.event_end),
      location: event.location ?? "",
      description: event.description ?? "",
    });
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (form.end && new Date(form.end) < new Date(form.start)) {
      setError("종료 시각은 시작 시각보다 빠를 수 없습니다.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      event_start: new Date(form.start).toISOString(),
      event_end: toIsoOrNull(form.end),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCalendarEvent(editingId, payload);
        setMessage("일정을 수정했습니다.");
      } else {
        await createCalendarEvent(payload);
        setMessage("일정을 등록했습니다.");
      }
      cancelEdit();
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(target: CalendarEvent) {
    if (!window.confirm(`"${target.title}" 일정을 삭제할까요?`)) return;
    setDeletingId(target.public_id);
    setError(null);
    setMessage(null);
    try {
      const result = await deleteCalendarEvent(target.public_id);
      setMessage(result.message);
      if (editingId === target.public_id) cancelEdit();
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  function renderList(items: CalendarEvent[]) {
    return (
      <ul className="admin-event-list">
        {items.map((event) => (
          <li
            key={event.public_id}
            className={editingId === event.public_id ? "is-editing" : undefined}
          >
            <div>
              <strong>{event.title}</strong>
              <p>
                {formatDateTime(event.event_start)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
            <div className="admin-notice-actions">
              <button
                type="button"
                className="btn-small btn-edit"
                onClick={() => startEdit(event)}
              >
                수정
              </button>
              <button
                type="button"
                className="btn-small btn-delete"
                disabled={deletingId === event.public_id}
                onClick={() => handleDelete(event)}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className="page">
      <section className="card card-wide">
        <div className="page-heading-row">
          <div>
            <h1>일정 관리</h1>
            <p className="subtitle">
              동아리 일정은 공지사항과 별도로 등록하며,{" "}
              <Link to="/calendar">일정 페이지</Link>에 표시됩니다.
            </p>
          </div>
        </div>

        <form className="form admin-event-form" onSubmit={handleSubmit}>
          <h2 className="section-title">{editingId ? "일정 수정" : "새 일정 등록"}</h2>
          <label className="field">
            <span>제목</span>
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
              maxLength={100}
              placeholder="예: 정기 발표회"
            />
          </label>
          <div className="form-grid-two">
            <label className="field">
              <span>시작</span>
              <input
                type="datetime-local"
                value={form.start}
                onChange={(event) => updateField("start", event.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>종료 (선택)</span>
              <input
                type="datetime-local"
                value={form.end}
                min={form.start || undefined}
                onChange={(event) => updateField("end", event.target.value)}
              />
            </label>
          </div>
          <label className="field">
            <span>장소 (선택)</span>
            <input
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              maxLength={200}
              placeholder="예: 학생회관 423호"
            />
          </label>
          <label className="field">
            <span>설명 (선택)</span>
            <textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={3}
            />
          </label>

          {error ? <p className="error">{error}</p> : null}
          {message ? <p className="success">{message}</p> : null}

          <div className="admin-event-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "저장 중..." : editingId ? "수정 저장" : "일정 등록"}
            </button>
            {editingId ? (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                수정 취소
              </button>
            ) : null}
          </div>
        </form>

        <hr className="divider" />

        {loading ? <Loading label="일정을 불러오는 중" /> : null}

        {!loading ? (
          <>
            <h2 className="section-title">다가오는 일정 {upcoming.length}개</h2>
            {upcoming.length ? (
              renderList(upcoming)
            ) : (
              <p className="muted">예정된 일정이 없습니다.</p>
            )}

            {past.length ? (
              <>
                <button
                  type="button"
                  className="btn-secondary admin-event-past-toggle"
                  onClick={() => setShowPast((open) => !open)}
                >
                  지난 일정 {past.length}개 {showPast ? "접기" : "보기"}
                </button>
                {showPast ? renderList(past) : null}
              </>
            ) : null}
          </>
        ) : null}

        <p className="switch-link">
          <Link to="/mypage">마이페이지로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
