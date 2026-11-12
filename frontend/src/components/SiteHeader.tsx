import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getAccessToken } from "../api/auth";
import { useRecruitment } from "../utils/useRecruitmentOpen";

const NAV_GROUPS = [
  {
    id: "club",
    label: "동아리 소개",
    links: [
      { to: "/about", label: "소개" },
      { to: "/members", label: "멤버" },
    ],
  },
  {
    id: "activities",
    label: "활동",
    links: [
      { to: "/projects", label: "프로젝트" },
      { to: "/studies", label: "스터디" },
      { to: "/gallery", label: "갤러리" },
    ],
  },
  {
    id: "news",
    label: "소식",
    links: [
      { to: "/notices", label: "공지사항" },
      { to: "/calendar", label: "일정" },
      { to: "/faqs", label: "FAQ" },
    ],
  },
];

/** 모든 페이지에서 사용하는 공통 상단 내비게이션 */
export function SiteHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const loggedIn = Boolean(getAccessToken());
  const recruitment = useRecruitment();
  const recruitmentClosed = recruitment?.is_open === false;
  const isHome = location.pathname === "/";

  const closeAll = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpenGroup(null);
    setMenuOpen(false);
  }, []);

  // 페이지 이동 시 메뉴를 닫고, 링크에 남은 포커스도 해제한다.
  useEffect(() => {
    closeAll();
    if (headerRef.current?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  }, [location.pathname, closeAll]);

  // 바깥 클릭 · ESC 로 닫기
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeAll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeAll]);

  // 스크롤 상태 + 상단 진행 바
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      headerRef.current?.style.setProperty("--scroll-progress", String(progress));
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location.pathname]);

  const canHover = () => window.matchMedia("(hover: hover) and (min-width: 901px)").matches;

  const openOnHover = (groupId: string) => {
    if (!canHover()) return;
    window.clearTimeout(closeTimer.current);
    setOpenGroup(groupId);
  };

  const closeOnLeave = () => {
    if (!canHover()) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenGroup(null), 160);
  };

  const headerClass = [
    // 모든 페이지에서 어두운 헤더(site-header-home), 홈에서는 영상 위에 겹치는 반투명(overlay)
    "site-header site-header-home",
    isHome && "site-header-overlay",
    scrolled && "site-header-scrolled",
    menuOpen && "site-header-menu-open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header ref={headerRef} className={headerClass}>
      <nav className="site-nav" aria-label="주요 메뉴">
        <Link to="/" className="site-brand">
          <img
            className="site-brand-logo"
            src="/brand/gen5_logo.png"
            alt=""
            aria-hidden="true"
          />
          <strong>제 5세대</strong>
        </Link>

        <button
          type="button"
          className="site-menu-toggle"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
          onClick={() => {
            setOpenGroup(null);
            setMenuOpen((open) => !open);
          }}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`site-menu${menuOpen ? " site-menu-open" : ""}`}>
          <div className="site-nav-links">
            {NAV_GROUPS.map((group) => {
              const groupActive = group.links.some((link) =>
                location.pathname.startsWith(link.to),
              );
              const expanded = openGroup === group.id;
              return (
                <div
                  key={group.id}
                  className={`site-nav-group${expanded ? " open" : ""}`}
                  onMouseEnter={() => openOnHover(group.id)}
                  onMouseLeave={closeOnLeave}
                >
                  <button
                    type="button"
                    className={`site-nav-group-button${groupActive ? " active" : ""}`}
                    aria-expanded={expanded}
                    aria-controls={`site-dropdown-${group.id}`}
                    onClick={() => {
                      window.clearTimeout(closeTimer.current);
                      // 마우스 환경에서는 hover 로 이미 열려 있으므로 클릭이 닫지 않게 한다.
                      if (canHover()) {
                        setOpenGroup(group.id);
                        return;
                      }
                      setOpenGroup((current) =>
                        current === group.id ? null : group.id,
                      );
                    }}
                  >
                    {group.label}
                    <svg
                      className="site-nav-caret"
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                    >
                      <path d="M3 4.5 6 7.5 9 4.5" />
                    </svg>
                  </button>
                  <div
                    id={`site-dropdown-${group.id}`}
                    className="site-nav-dropdown"
                    inert={!expanded}
                  >
                    {group.links.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                          isActive
                            ? "site-dropdown-link active"
                            : "site-dropdown-link"
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="site-auth-links">
            {loggedIn ? (
              <Link to="/mypage" className="site-dashboard-link">
                마이페이지
              </Link>
            ) : (
              <>
                <Link to="/login" className="site-login-link">
                  로그인
                </Link>
                {recruitmentClosed ? null : (
                  <Link to="/signup" className="site-signup-link">
                    가입 신청
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
      <span className="site-scroll-progress" aria-hidden="true" />
    </header>
  );
}
