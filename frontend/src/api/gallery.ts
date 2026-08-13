import { apiRequest } from "./client";
import type { GalleryItem, GalleryListResponse } from "../types/gallery";

/** GET /gallery — 공개 갤러리 목록 */
export function fetchGallery(): Promise<GalleryListResponse> {
  return apiRequest<GalleryListResponse>("/gallery");
}

/** GET /gallery/{public_id} — 공개 갤러리 상세 */
export function fetchGalleryItem(publicId: string): Promise<GalleryItem> {
  return apiRequest<GalleryItem>(
    `/gallery/${encodeURIComponent(publicId)}`,
  );
}
