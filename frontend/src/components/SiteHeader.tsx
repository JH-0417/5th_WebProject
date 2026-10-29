import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getAccessToken } from "../api/auth";

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
  const loggedIn = Boolean(getAccessToken());

  useEffect(() => {
    setMenuOpen(false);
    setOpenGroup(null);
  }, [location.pathname]);

  return (
    <header
      className={`site-header${location.pathname === "/" ? " site-header-home" : ""}`}
    >
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
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
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
                >
                  <button
                    type="button"
                    className={`site-nav-group-button${groupActive ? " active" : ""}`}
                    aria-expanded={expanded}
                    aria-controls={`site-dropdown-${group.id}`}
                    onClick={() =>
                      setOpenGroup((current) =>
                        current === group.id ? null : group.id,
                      )
                    }
                  >
                    {group.label}
                    <span aria-hidden="true">⌄</span>
                  </button>
                  <div
                    id={`site-dropdown-${group.id}`}
                    className="site-nav-dropdown"
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
                <Link to="/signup" className="site-signup-link">
                  가입 신청
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
