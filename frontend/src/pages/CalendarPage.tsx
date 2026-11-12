import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCalendarEvents } from "../api/calendar";
import { EventDetailDialog } from "../components/EventDetailDialog";
import type { CalendarEvent } from "../types/calendar";
import { Loading } from "../components/Loading";

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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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

  // 오늘 이후(진행 중 포함) 가까운 일정 5개
  const upcoming = useMemo(() => {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return events
      .filter((event) => new Date(event.event_end ?? event.event_start) >= startOfToday)
      .slice(0, 5);
  }, [events, today]);

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
      <section className="card card-calendar card-full">
        <div className="calendar-header">
          <div>
            <h1>동아리 일정</h1>
            <p className="subtitle">동아리 행사와 모임 일정을 확인하세요.</p>
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

        {loading ? <Loading /> : null}
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
                      <button
                        type="button"
                        key={event.public_id}
                        className="calendar-event"
                        title={`${event.title}${event.location ? ` · ${event.location}` : ""}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <time dateTime={event.event_start}>
                          {formatEventTime(event.event_start)}
                        </time>
                        <strong>{event.title}</strong>
                        {event.location ? <span>{event.location}</span> : null}
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {upcoming.length > 0 ? (
          <section className="upcoming-events" aria-label="다가오는 일정">
            <h2>다가오는 일정</h2>
            <ul>
              {upcoming.map((event) => {
                const start = new Date(event.event_start);
                return (
                  <li key={event.public_id}>
                    <button type="button" onClick={() => setSelectedEvent(event)}>
                      <span className="upcoming-date">
                        <b>{start.getDate()}</b>
                        <small>{start.getMonth() + 1}월 · {WEEKDAYS[start.getDay()]}</small>
                      </span>
                      <span className="upcoming-body">
                        <strong>{event.title}</strong>
                        <small>
                          {formatEventTime(event.event_start)}
                          {event.location ? ` · ${event.location}` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>

      {selectedEvent ? (
        <EventDetailDialog
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      ) : null}
    </main>
  );
}
