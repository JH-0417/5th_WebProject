import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchGalleryItem } from "../api/gallery";
import type { GalleryItem } from "../types/gallery";
import { formatDateTime } from "../utils/date";

/** 공개 갤러리 상세 페이지 */
export function GalleryDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) {
      setError("갤러리 사진 식별자가 없습니다.");
      setLoading(false);
      return;
    }

    const galleryId = publicId;
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchGalleryItem(galleryId);
        if (!cancelled) setItem(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "갤러리 사진을 불러오지 못했습니다.",
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
  }, [publicId]);

  return (
    <main className="page">
      <article className="card card-gallery-detail">
        {loading ? <p className="muted">불러오는 중...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {item ? (
          <>
            <img
              className="gallery-detail-image"
              src={item.image_url}
              alt={item.caption || "동아리 활동 사진"}
            />
            <div className="gallery-detail-info">
              <h1>{item.caption || "활동 사진"}</h1>
              <time dateTime={item.created_at}>
                등록 {formatDateTime(item.created_at)}
              </time>
            </div>
          </>
        ) : null}

        <p className="switch-link">
          <Link to="/gallery">갤러리로 돌아가기</Link>
        </p>
      </article>
    </main>
  );
}
