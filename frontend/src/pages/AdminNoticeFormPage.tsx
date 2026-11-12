import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createNotice,
  deleteNoticeImage,
  updateNotice,
  uploadNoticeImage,
} from "../api/admin";
import { fetchNotice } from "../api/notices";
import { Loading } from "../components/Loading";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 관리자 공지 작성·수정 공용 폼 (일정은 일정 관리 메뉴에서 따로 등록) */
export function AdminNoticeFormPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(publicId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // 서버에 저장된 이미지 / 새로 고른 파일 / 저장된 이미지 삭제 여부
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeSavedImage, setRemoveSavedImage] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) return;
    const noticeId = publicId;
    let cancelled = false;

    async function loadNotice() {
      try {
        const notice = await fetchNotice(noticeId);
        if (cancelled) return;
        setTitle(notice.title);
        setContent(notice.content);
        setSavedImageUrl(notice.image_url);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "공지를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadNotice();
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  // 새로 고른 파일 미리보기 URL 정리
  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("jpg, png, webp, gif 이미지만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("이미지 크기는 8MB 이하여야 합니다.");
      return;
    }
    setError(null);
    setImageFile(file);
    setRemoveSavedImage(false);
  }

  function handleRemoveImage() {
    if (imageFile) {
      setImageFile(null);
      return;
    }
    setRemoveSavedImage(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    const payload = { title: title.trim(), content: content.trim() };

    try {
      const saved =
        isEdit && publicId
          ? await updateNotice(publicId, payload)
          : await createNotice(payload);

      // 글을 먼저 저장한 뒤 이미지를 올립니다. 이미지가 실패해도 글은 남습니다.
      try {
        if (imageFile) {
          await uploadNoticeImage(saved.public_id, imageFile);
        } else if (removeSavedImage && savedImageUrl) {
          await deleteNoticeImage(saved.public_id);
        }
      } catch (imageError) {
        const reason =
          imageError instanceof Error ? imageError.message : "알 수 없는 오류";
        window.alert(`공지는 저장했지만 이미지 처리에 실패했습니다.\n${reason}`);
      }

      navigate(`/notices/${saved.public_id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <section className="card card-wide">
          <Loading label="공지를 불러오는 중" />
        </section>
      </main>
    );
  }

  const shownImage = previewUrl ?? (removeSavedImage ? null : savedImageUrl);

  return (
    <main className="page">
      <section className="card card-wide">
        <h1>{isEdit ? "공지사항 수정" : "새 공지 작성"}</h1>
        <p className="subtitle">
          일정은 <Link to="/admin/calendar">일정 관리</Link>에서 따로 등록하세요.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={100}
            />
          </label>

          <label className="field">
            <span>내용</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={10}
            />
          </label>

          <div className="field">
            <span>이미지 (선택)</span>
            {shownImage ? (
              <div className="image-picker-preview">
                <img src={shownImage} alt="첨부 이미지 미리보기" />
                <div className="image-picker-actions">
                  <label className="btn-small btn-view image-picker-change">
                    다른 이미지 선택
                    <input
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      onChange={handleFileChange}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-small btn-delete"
                    onClick={handleRemoveImage}
                  >
                    이미지 빼기
                  </button>
                </div>
              </div>
            ) : (
              <label className="image-picker-drop">
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={handleFileChange}
                />
                <strong>이미지 선택</strong>
                <small>jpg · png · webp · gif, 8MB 이하</small>
              </label>
            )}
          </div>

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" disabled={saving}>
            {saving ? "저장 중..." : isEdit ? "수정 저장" : "공지 등록"}
          </button>
        </form>

        <p className="switch-link">
          <Link to="/admin/notices">관리 목록으로 돌아가기</Link>
        </p>
      </section>
    </main>
  );
}
