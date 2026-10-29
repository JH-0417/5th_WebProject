import { useEffect, useState } from "react";
import { fetchRecruitment } from "../api/recruitment";
import type { Recruitment } from "../types/recruitment";

/**
 * 모집 상태를 불러오는 훅.
 *
 * 불러오는 중이거나 실패하면 null을 돌려줍니다.
 * (화면에서는 null이면 기존처럼 지원 링크를 보여 주고, 최종 판단은 서버가 합니다.)
 */
export function useRecruitment(): Recruitment | null {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecruitment()
      .then((data) => {
        if (!cancelled) setRecruitment(data);
      })
      .catch(() => {
        if (!cancelled) setRecruitment(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return recruitment;
}
