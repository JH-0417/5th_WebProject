import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCalendarEvents } from "../api/calendar";
import type { CalendarEvent } from "../types/calendar";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createCalendarDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function formatEventTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** 공개 월간 일정 캘린더 페이지 */
export function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchCalendarEvents();
        if (!cancelled) setEvents(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "일정을 불러오지 못했습니다.",
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

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.event_start));
      const existing = grouped.get(key) ?? [];
      existing.push(event);
      grouped.set(key, existing);
    }
    return grouped;
  }, [events]);

  const days = useMemo(() => createCalendarDays(currentMonth), [currentMonth]);
  const monthTitle = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(currentMonth);
  const todayKey = dateKey(today);

  function moveMonth(offset: number) {
    setCurrentMonth(
      (month) => new Date(month.getFullYear(), month.getMonth() + offset, 1),
    );
  }

  function moveToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <main className="page">
      <section className="card card-calendar">
        <div className="calendar-header">
          <div>
            <h1>동아리 일정</h1>
            <p className="subtitle">공지사항에 등록된 일정을 확인하세요.</p>
          </div>
          <div className="calendar-navigation" aria-label="월 이동">
            <button
              type="button"
              aria-label="이전 달"
              title="이전 달"
              onClick={() => moveMonth(-1)}
            >
              {"<"}
            </button>
            <button type="button" onClick={moveToday}>
              Today
            </button>
            <button
              type="button"
              aria-label="다음 달"
              title="다음 달"
              onClick={() => moveMonth(1)}
            >
              {">"}
            </button>
          </div>
        </div>

        <h2 className="calendar-month-title">{monthTitle}</h2>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && events.length === 0 ? (
          <p className="muted">등록된 일정이 없습니다.</p>
        ) : null}

        <div className="calendar-scroll">
          <div className="calendar-grid">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="calendar-weekday">
                {weekday}
              </div>
            ))}

            {days.map((day) => {
              const key = dateKey(day);
              const dayEvents = eventsByDate.get(key) ?? [];
              const outsideMonth = day.getMonth() !== currentMonth.getMonth();

              return (
                <section
                  key={key}
                  className={[
                    "calendar-day",
                    outsideMonth ? "calendar-day-outside" : "",
                    key === todayKey ? "calendar-day-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일`}
                >
                  <span className="calendar-day-number">{day.getDate()}</span>
                  <div className="calendar-events">
                    {dayEvents.map((event) => (
                      <Link
                        key={event.public_id}
                        to={`/notices/${event.public_id}`}
                        state={{ from: "/calendar" }}
                        className="calendar-event"
                        title={`${event.title}${event.location ? ` · ${event.location}` : ""}`}
                      >
                        <time dateTime={event.event_start}>
                          {formatEventTime(event.event_start)}
                        </time>
                        <strong>{event.title}</strong>
                        {event.location ? <span>{event.location}</span> : null}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
