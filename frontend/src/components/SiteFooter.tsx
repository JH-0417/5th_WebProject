import { Link, useLocation } from "react-router-dom";

/** 푸터를 표시하지 않는 페이지 (인증 화면) */
const HIDDEN_PATHS = ["/login", "/signup"];

type SocialIconName = "instagram" | "github" | "kakao";

function SocialIcon({ name }: { name: SocialIconName }) {
  if (name === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle className="social-icon-dot" cx="17.5" cy="6.5" r="1" />
      </svg>
    );
  }

  if (name === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.8a9.4 9.4 0 0 0-3 18.3c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.6 2.4 1.1 2.9.9.1-.7.4-1.1.7-1.4-2.3-.3-4.6-1.1-4.6-4.7 0-1 .4-1.9 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.3 9.3 0 0 1 4.9 0c1.8-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.6 1 2.6 0 3.6-2.3 4.4-4.6 4.7.4.3.7 1 .7 1.9v3c0 .3.2.6.7.5A9.4 9.4 0 0 0 12 2.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.9 5.3 4.8 6.7l-1 3.5c-.1.3.3.5.5.3l4.2-2.8c.5.1 1 .1 1.5.1 5.5 0 10-3.5 10-7.8S17.5 3 12 3Z" />
    </svg>
  );
}

/** 메인 페이지와 같은 공통 푸터 — 로그인·회원가입 화면에서는 숨긴다. */
export function SiteFooter() {
  const { pathname } = useLocation();
  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <footer className="landing-footer">
      <div className="landing-footer-brand">
        <div>
          <img src="/brand/gen5_logo.png" alt="" aria-hidden="true" />
          <strong>제 5세대</strong>
        </div>
        <span>건국대학교 글로컬캠퍼스 IT 동아리</span>
        <div className="landing-social-links">
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            title="Instagram"
          >
            <SocialIcon name="instagram" />
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <SocialIcon name="github" />
          </a>
          <a
            href="https://open.kakao.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Kakao Open Chat"
            title="Kakao Open Chat"
          >
            <SocialIcon name="kakao" />
          </a>
        </div>
      </div>

      <div className="landing-footer-links">
        <strong>Quick Links</strong>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/members">Members</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/calendar">Events</Link>
        <Link to="/gallery">Gallery</Link>
      </div>

      <div className="landing-footer-contact">
        <strong>Contact</strong>
        <address>
          충청북도 충주시 충원대로 268
          <br />
          건국대학교 글로컬캠퍼스
          <br />
          학생회관 423호
        </address>
        <a
          href="https://naver.me/FZobp3rZ"
          target="_blank"
          rel="noreferrer"
        >
          네이버 지도에서 보기 →
        </a>
      </div>

      <small className="landing-footer-copy">
        © 2026 제 5세대. All rights reserved.
        <br />
        Made with ❤ by 5th Generation
        <br />
        Created by 류종걸, 박하원, 유수민
      </small>
    </footer>
  );
}
