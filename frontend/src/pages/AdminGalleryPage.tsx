import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  deleteGalleryImage,
  replaceGalleryImage,
  updateGalleryCaption,
  uploadGalleryImage,
} from "../api/admin";
import { fetchGallery } from "../api/gallery";
import type { GalleryItem } from "../types/gallery";
import { formatDateTime } from "../utils/date";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "jpg, png, webp, gif 이미지만 업로드할 수 있습니다.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "이미지 크기는 8MB 이하여야 합니다.";
  }
  return null;
}

/** 관리자 갤러리 등록·수정·삭제 페이지 */
export function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [replacementFiles, setReplacementFiles] = useState<
    Record<string, File | undefined>
  >({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadGallery() {
    setLoading(true);
    try {
      const data = await fetchGallery();
      setItems(data.items);
      setCaptions(
        Object.fromEntries(
          data.items.map((item) => [item.public_id, item.caption ?? ""]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "갤러리를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGallery();
  }, []);

  function resetFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    if (!uploadFile) {
      setError("업로드할 사진을 선택하세요.");
      return;
    }
    const validationError = validateImage(uploadFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    try {
      await uploadGalleryImage(uploadFile, uploadCaption);
      setUploadFile(null);
      setUploadCaption("");
      setFileInputKey((value) => value + 1);
      setMessage("갤러리 사진이 등록되었습니다.");
      await loadGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 등록에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCaptionSave(item: GalleryItem) {
    resetFeedback();
    setBusyId(`caption-${item.public_id}`);
    try {
      await updateGalleryCaption(item.public_id, captions[item.public_id] ?? "");
      setMessage("사진 설명이 수정되었습니다.");
      await loadGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "설명 수정에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleImageReplace(item: GalleryItem) {
    resetFeedback();
    const file = replacementFiles[item.public_id];
    if (!file) {
      setError("교체할 사진을 선택하세요.");
      return;
    }
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusyId(`image-${item.public_id}`);
    try {
      await replaceGalleryImage(item.public_id, file);
      setReplacementFiles((current) => ({
        ...current,
        [item.public_id]: undefined,
      }));
      setMessage("갤러리 이미지가 교체되었습니다.");
      await loadGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 교체에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: GalleryItem) {
    const confirmed = window.confirm(
      `"${item.caption || "활동 사진"}"을 삭제할까요?`,
    );
    if (!confirmed) return;

    resetFeedback();
    setBusyId(`delete-${item.public_id}`);
    try {
      const result = await deleteGalleryImage(item.public_id);
      setMessage(result.message);
      await loadGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page">
      <section className="card card-admin-gallery">
        <div className="page-heading-row">
          <div>
            <h1>갤러리 관리</h1>
            <p className="subtitle">활동 사진을 등록·수정·삭제합니다.</p>
          </div>
          <Link to="/gallery" className="btn-primary-link btn-inline">
            공개 갤러리 보기
          </Link>
        </div>

        <form className="form admin-gallery-upload" onSubmit={handleUpload}>
          <label className="field">
            사진 파일
            <input
              key={fileInputKey}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) =>
                setUploadFile(event.target.files?.[0] ?? null)
              }
              required
            />
          </label>
          <label className="field">
            사진 설명
            <input
              value={uploadCaption}
              onChange={(event) => setUploadCaption(event.target.value)}
              placeholder="활동 내용을 입력하세요. (선택)"
            />
          </label>
          <button type="submit" disabled={uploading}>
            {uploading ? "업로드 중..." : "사진 등록"}
          </button>
        </form>

        {error ? <p className="error admin-gallery-feedback">{error}</p> : null}
        {message ? (
          <p className="success admin-gallery-feedback">{message}</p>
        ) : null}
        {loading ? <p className="muted">불러오는 중...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="muted">등록된 사진이 없습니다.</p>
        ) : null}

        <ul className="admin-gallery-grid">
          {items.map((item) => {
            const captionBusy = busyId === `caption-${item.public_id}`;
            const imageBusy = busyId === `image-${item.public_id}`;
            const deleteBusy = busyId === `delete-${item.public_id}`;

            return (
              <li key={item.public_id} className="admin-gallery-card">
                <img
                  src={item.image_url}
                  alt={item.caption || "동아리 활동 사진"}
                />
                <div className="admin-gallery-card-body">
                  <time dateTime={item.created_at}>
                    등록 {formatDateTime(item.created_at)}
                  </time>

                  <label className="field">
                    사진 설명
                    <input
                      value={captions[item.public_id] ?? ""}
                      onChange={(event) =>
                        setCaptions((current) => ({
                          ...current,
                          [item.public_id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-small btn-edit"
                    disabled={busyId !== null}
                    onClick={() => void handleCaptionSave(item)}
                  >
                    {captionBusy ? "저장 중..." : "설명 저장"}
                  </button>

                  <label className="field">
                    이미지 교체
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(event) =>
                        setReplacementFiles((current) => ({
                          ...current,
                          [item.public_id]: event.target.files?.[0],
                        }))
                      }
                    />
                  </label>
                  <div className="admin-gallery-actions">
                    <button
                      type="button"
                      className="btn-small btn-view"
                      disabled={busyId !== null}
                      onClick={() => void handleImageReplace(item)}
                    >
                      {imageBusy ? "교체 중..." : "이미지 교체"}
                    </button>
                    <button
                      type="button"
                      className="btn-small btn-delete"
                      disabled={busyId !== null}
                      onClick={() => void handleDelete(item)}
                    >
                      {deleteBusy ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
