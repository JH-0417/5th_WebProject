import { useEffect } from "react";

/** 화면에 들어올 때 아래에서 떠오르는 요소들 (마크업 수정 없이 자동 적용) */
const REVEAL_SELECTOR = [
  ".landing-section-heading",
  ".landing-program-card",
  ".landing-content-links",
  ".landing-story-card",
  ".landing-join > div",
  ".landing-location > *",
  ".landing-footer > *",
  ".about-section-heading",
  ".about-profile-list > div",
  ".about-value-grid article",
  ".about-history li",
  ".about-identity > *",
  ".members-toolbar",
  ".member-card",
  ".gallery-card",
  ".photo-month",
  ".upcoming-events",
  ".privacy-section",
  ".member-manager",
  ".activity-card",
  ".notice-list-item",
  ".faq-item",
  ".admin-gallery-card",
  ".applicant-card",
].join(",");

const MAX_STAGGER = 6;
const STAGGER_MS = 80;

export function useScrollReveal() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    // effect 마다 새로 관찰 (StrictMode 의 재실행에서도 누락되지 않도록 DOM 표시 대신 WeakSet 사용)
    const observed = new WeakSet<Element>();
    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("is-revealed");
          intersection.unobserve(el);
          // 등장이 끝나면 지연을 지워 hover 모션이 바로 반응하게 한다.
          window.setTimeout(() => el.style.removeProperty("--reveal-delay"), 1500);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    const prepare = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
        if (observed.has(el) || el.classList.contains("is-revealed")) return;
        observed.add(el);
        // 같은 부모 안에서의 순서로 살짝씩 시차를 둔다.
        const index = el.parentElement
          ? Array.prototype.indexOf.call(el.parentElement.children, el)
          : 0;
        el.style.setProperty(
          "--reveal-delay",
          `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`,
        );
        el.classList.add("reveal");
        intersection.observe(el);
      });
    };

    prepare(document);

    // 데이터를 비동기로 불러와 나중에 그려지는 카드도 처리
    let frame = 0;
    const mutation = new MutationObserver(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        prepare(document);
      });
    });
    mutation.observe(document.getElementById("root") ?? document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      mutation.disconnect();
      intersection.disconnect();
    };
  }, []);
}
