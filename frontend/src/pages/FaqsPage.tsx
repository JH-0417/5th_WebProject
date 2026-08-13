import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFaqs } from "../api/faqs";
import type { Faq } from "../types/faqs";

/** 공개 FAQ 목록 페이지 */
export function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchFaqs();
        if (!cancelled) setFaqs(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "FAQ를 불러오지 못했습니다.",
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

  return (
    <main className="page">
      <section className="card card-faq">
        <h1>자주 묻는 질문</h1>
        <p className="subtitle">
          궁금한 질문을 선택하면 답변을 확인할 수 있습니다.
        </p>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && faqs.length === 0 ? (
          <p className="muted">등록된 FAQ가 없습니다.</p>
        ) : null}

        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.public_id} className="faq-item">
              <summary>
                <span className="faq-icon" aria-hidden="true">
                  💡
                </span>
                <span>{faq.question}</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
