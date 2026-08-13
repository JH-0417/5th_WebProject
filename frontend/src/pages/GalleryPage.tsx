import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGallery } from "../api/gallery";
import type { GalleryItem } from "../types/gallery";
import { formatDateTime } from "../utils/date";

/** 공개 갤러리 목록 페이지 */
export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchGallery();
        if (!cancelled) setItems(data.items);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "갤러리를 불러오지 못했습니다.",
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
      <section className="card card-gallery">
        <h1>활동 갤러리</h1>
        <p className="subtitle">동아리의 활동 모습을 확인하세요.</p>

        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="muted">등록된 사진이 없습니다.</p>
        ) : null}

        <ul className="gallery-grid">
          {items.map((item) => (
            <li key={item.public_id}>
              <Link
                to={`/gallery/${item.public_id}`}
                className="gallery-card"
              >
                <img
                  src={item.image_url}
                  alt={item.caption || "동아리 활동 사진"}
                  loading="lazy"
                />
                <div className="gallery-card-info">
                  <strong>{item.caption || "활동 사진"}</strong>
                  <time dateTime={item.created_at}>
                    {formatDateTime(item.created_at)}
                  </time>
                </div>
              </Link>
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
