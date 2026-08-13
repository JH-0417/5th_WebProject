/** 백엔드 GalleryResponse와 같은 갤러리 사진 타입 */
export type GalleryItem = {
  public_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryListResponse = {
  total: number;
  items: GalleryItem[];
};
