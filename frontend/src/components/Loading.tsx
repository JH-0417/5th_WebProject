type LoadingProps = {
  /** 화면 낭독기용 설명 (화면에는 보이지 않음) */
  label?: string;
  /** 버튼 안 등 좁은 곳에 쓰는 작은 크기 */
  size?: "default" | "small";
};

/** 데이터를 불러오는 동안 보여주는 회전 로딩 심볼 */
export function Loading({ label = "불러오는 중", size = "default" }: LoadingProps) {
  return (
    <div
      className={`loading${size === "small" ? " loading-small" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="loading-spinner" aria-hidden="true">
        <span />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
