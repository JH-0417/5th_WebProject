import { useEffect, useState, type FormEvent } from "react";
import { updateRecruitment } from "../api/admin";
import { fetchRecruitment } from "../api/recruitment";
import type { Recruitment } from "../types/recruitment";

/**
 * 관리자용 모집(지원하기) 열기·닫기 카드.
 *
 * - 열려 있을 때만 방문자가 가입 신청을 할 수 있습니다. (서버가 최종 차단)
 * - 안내 문구는 지원하기 화면에 함께 보여 줍니다. (예: "2학기 신입 모집 ~9/15")
 */
export function RecruitmentToggle() {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecruitment()
      .then((data) => {
        if (cancelled) return;
        setRecruitment(data);
        setMessage(data.message ?? "");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "모집 상태를 불러오지 못했습니다.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(isOpen: boolean) {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const data = await updateRecruitment({ is_open: isOpen, message });
      setRecruitment(data);
      setMessage(data.message ?? "");
      setNotice(data.is_open ? "모집을 열었습니다." : "모집을 닫았습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "모집 상태를 바꾸지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recruitment) void save(recruitment.is_open);
  }

  const isOpen = recruitment?.is_open ?? false;

  return (
    <section className="recruitment-toggle">
      <div className="recruitment-toggle-header">
        <div>
          <h2>모집(지원하기) 관리</h2>
          <p className="muted">
            {recruitment === null
              ? "모집 상태를 불러오는 중..."
              : isOpen
                ? "지금 가입 신청을 받고 있습니다."
                : "지금은 가입 신청을 받지 않습니다."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOpen}
          aria-label="모집 열기/닫기"
          className={`recruitment-switch${isOpen ? " is-on" : ""}`}
          disabled={recruitment === null || saving}
          onClick={() => void save(!isOpen)}
        >
          <span className="recruitment-switch-label">
            {isOpen ? "모집 중" : "모집 마감"}
          </span>
          <span className="recruitment-switch-knob" aria-hidden="true" />
        </button>
      </div>

      <form className="recruitment-message-form" onSubmit={handleSaveMessage}>
        <label htmlFor="recruitment-message">안내 문구 (선택)</label>
        <div className="recruitment-message-row">
          <input
            id="recruitment-message"
            type="text"
            maxLength={200}
            placeholder="예: 2학기 신입 부원 모집 중 (~9/15)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={recruitment === null || saving}
          />
          <button type="submit" className="btn-secondary" disabled={recruitment === null || saving}>
            문구 저장
          </button>
        </div>
      </form>

      {notice ? <p className="success">{notice}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
