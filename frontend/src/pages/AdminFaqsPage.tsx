import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createFaq, deleteFaq } from "../api/admin";
import { fetchFaqs } from "../api/faqs";
import type { Faq } from "../types/faqs";

/** 관리자 FAQ 등록·삭제 페이지 */
export function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFaqs() {
    setLoading(true);
    try {
      const data = await fetchFaqs();
      setFaqs(data.items);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "FAQ를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFaqs();
  }, []);

  function resetFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();
    if (!trimmedQuestion || !trimmedAnswer) {
      setError("질문과 답변을 모두 입력하세요.");
      return;
    }

    setSubmitting(true);
    try {
      await createFaq({
        question: trimmedQuestion,
        answer: trimmedAnswer,
      });
      setQuestion("");
      setAnswer("");
      setMessage("FAQ가 등록되었습니다.");
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAQ 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(faq: Faq) {
    const confirmed = window.confirm(`"${faq.question}" FAQ를 삭제할까요?`);
    if (!confirmed) return;

    resetFeedback();
    setDeletingId(faq.public_id);
    try {
      const result = await deleteFaq(faq.public_id);
      setMessage(result.message);
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAQ 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="page">
      <section className="card card-admin-faq">
        <div className="page-heading-row">
          <div>
            <h1>FAQ 관리</h1>
            <p className="subtitle">자주 묻는 질문을 등록하고 삭제합니다.</p>
          </div>
          <Link to="/faqs" className="btn-primary-link btn-inline">
            공개 FAQ 보기
          </Link>
        </div>

        <form className="form admin-faq-form" onSubmit={handleSubmit}>
          <label className="field">
            질문
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={200}
              placeholder="자주 묻는 질문을 입력하세요."
              required
            />
          </label>
          <label className="field">
            답변
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={5}
              placeholder="질문에 대한 답변을 입력하세요."
              required
            />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "FAQ 등록"}
          </button>
        </form>

        {error ? <p className="error admin-faq-feedback">{error}</p> : null}
        {message ? (
          <p className="success admin-faq-feedback">{message}</p>
        ) : null}
        {loading ? <p className="muted">불러오는 중...</p> : null}
        {!loading && faqs.length === 0 ? (
          <p className="muted">등록된 FAQ가 없습니다.</p>
        ) : null}

        <ul className="admin-faq-list">
          {faqs.map((faq) => (
            <li key={faq.public_id} className="admin-faq-item">
              <div>
                <strong>
                  <span aria-hidden="true">💡</span> {faq.question}
                </strong>
                <p>{faq.answer}</p>
              </div>
              <button
                type="button"
                className="btn-small btn-delete"
                disabled={deletingId !== null}
                onClick={() => void handleDelete(faq)}
              >
                {deletingId === faq.public_id ? "삭제 중..." : "삭제"}
              </button>
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
