import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getAccessToken } from "../api/auth";

const PUBLIC_LINKS = [
  { to: "/projects", label: "프로젝트" },
  { to: "/studies", label: "스터디" },
  { to: "/notices", label: "공지" },
  { to: "/gallery", label: "갤러리" },
  { to: "/calendar", label: "일정" },
  { to: "/faqs", label: "FAQ" },
];

/** 모든 페이지에서 사용하는 공통 상단 내비게이션 */
export function SiteHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const loggedIn = Boolean(getAccessToken());

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`site-header${location.pathname === "/" ? " site-header-home" : ""}`}
    >
      <nav className="site-nav" aria-label="주요 메뉴">
        <Link to="/" className="site-brand">
          <span aria-hidden="true">5</span>
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
            {PUBLIC_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "site-nav-link active" : "site-nav-link"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="site-auth-links">
            {loggedIn ? (
              <Link to="/dashboard" className="site-dashboard-link">
                대시보드
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
