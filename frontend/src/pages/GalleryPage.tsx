import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchGallery } from "../api/gallery";
import { Loading } from "../components/Loading";
import type { GalleryItem } from "../types/gallery";

type MonthGroup = {
  key: string;
  label: string;
  items: GalleryItem[];
};

const monthFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
});
const dayFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

/** 휴대폰 사진첩처럼 월별로 묶어 보여주는 공개 갤러리 */
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

  // 최신순으로 받은 사진을 "2026년 11월" 같은 월 단위로 묶습니다.
  const groups = useMemo<MonthGroup[]>(() => {
    const result: MonthGroup[] = [];
    for (const item of items) {
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      let group = result[result.length - 1];
      if (!group || group.key !== key) {
        group = { key, label: monthFormatter.format(date), items: [] };
        result.push(group);
      }
      group.items.push(item);
    }
    return result;
  }, [items]);

  return (
    <main className="page">
      <section className="card card-gallery card-full">
        <div className="gallery-heading">
          <div>
            <h1>활동 갤러리</h1>
            <p className="subtitle">동아리의 활동 모습을 확인하세요.</p>
          </div>
          {items.length ? (
            <span className="gallery-count">사진 {items.length}장</span>
          ) : null}
        </div>

        {loading ? <Loading label="사진을 불러오는 중" /> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <p className="muted">등록된 사진이 없습니다.</p>
        ) : null}

        {groups.map((group) => (
          <section key={group.key} className="photo-month" aria-label={group.label}>
            <h2 className="photo-month-title">
              {group.label}
              <small>{group.items.length}장</small>
            </h2>
            <ul className="photo-grid">
              {group.items.map((item) => (
                <li key={item.public_id}>
                  <Link
                    to={`/gallery/${item.public_id}`}
                    className="photo-tile"
                    aria-label={item.caption || "동아리 활동 사진"}
                  >
                    <img
                      src={item.image_url}
                      alt={item.caption || "동아리 활동 사진"}
                      loading="lazy"
                    />
                    <span className="photo-tile-overlay" aria-hidden="true">
                      <strong>{item.caption || "활동 사진"}</strong>
                      <time dateTime={item.created_at}>
                        {dayFormatter.format(new Date(item.created_at))}
                      </time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
