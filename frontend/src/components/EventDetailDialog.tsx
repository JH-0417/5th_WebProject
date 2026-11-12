import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CalendarEvent } from "../types/calendar";
import { formatDateTime } from "../utils/date";

type EventDetailDialogProps = {
  event: CalendarEvent;
  onClose: () => void;
};

/** 캘린더 일정 상세를 보여주는 모달 (ESC · 바깥 클릭으로 닫힘) */
export function EventDetailDialog({ event, onClose }: EventDetailDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  // 페이지 애니메이션(transform)의 영향을 받지 않도록 body에 직접 그립니다.
  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="dialog-close"
          aria-label="닫기"
          onClick={onClose}
        >
          ×
        </button>
        <span className="dialog-eyebrow">SCHEDULE</span>
        <h2 id="event-dialog-title">{event.title}</h2>
        <dl className="dialog-meta">
          <div>
            <dt>시작</dt>
            <dd>{formatDateTime(event.event_start)}</dd>
          </div>
          {event.event_end ? (
            <div>
              <dt>종료</dt>
              <dd>{formatDateTime(event.event_end)}</dd>
            </div>
          ) : null}
          {event.location ? (
            <div>
              <dt>장소</dt>
              <dd>{event.location}</dd>
            </div>
          ) : null}
        </dl>
        {event.description ? (
          <p className="dialog-description">{event.description}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
