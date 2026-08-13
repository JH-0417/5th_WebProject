import { Link } from "react-router-dom";
import { getAccessToken } from "../api/auth";
import heroImage from "../assets/hero.png";

const ACTIVITIES = [
  "스터디 활동",
  "소프트웨어 프로젝트",
  "해커톤 참가",
  "프로젝트 발표회",
  "정기 모임 & 회식",
  "MT & 축제",
];

const PROGRAMS = [
  {
    number: "01",
    title: "스터디 활동",
    description:
      "주 1회 약 1시간씩 진행되며 C, 파이썬, 게임 개발 기초를 함께 학습합니다.",
  },
  {
    number: "02",
    title: "소프트웨어 프로젝트",
    description:
      "웹 및 게임 프로그래밍 팀을 구성하여 아이디어를 실질적인 결과물로 만듭니다.",
  },
  {
    number: "03",
    title: "프로젝트 발표회",
    description:
      "월 1회 정기 발표회를 통해 프로젝트 진행 상황을 공유하고 피드백을 나눕니다.",
  },
  {
    number: "04",
    title: "정기 모임 및 회식",
    description:
      "발표회와 MT, 축제를 함께하며 부원 간의 친목과 유대감을 쌓습니다.",
  },
];

const STORIES = [
  {
    initial: "박",
    name: "박하원",
    department: "시각영상디자인과",
    quote:
      "다양한 프로젝트를 경험하며 디자인을 넘어 개발과 코딩까지 폭넓게 이해하게 되었습니다. 같은 목표를 가진 사람들과 소중한 인연도 만들 수 있었습니다.",
  },
  {
    initial: "류",
    name: "류종걸",
    department: "컴퓨터공학과",
    quote:
      "Git을 통한 협업과 역할 분담을 직접 경험했습니다. 이론을 실제 프로젝트에 적용하면서 포트폴리오를 준비하는 데에도 큰 도움이 되었습니다.",
  },
];

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

/** 누구나 접근할 수 있는 메인 랜딩 페이지 */
export function LandingPage() {
  const loggedIn = Boolean(getAccessToken());

  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <p className="landing-club-meta">
              건국대학교 글로컬캠퍼스 IT 동아리
            </p>
            <p className="landing-club-submeta">
              중앙동아리 창업학술분과 · KONKUK UNIV.
            </p>
            <h1>제 5세대</h1>
            <p className="landing-hero-description">
              함께 코딩하고, 함께 성장하는 공간.
              <br />
              아이디어를 현실로 만드는 개발자들의 커뮤니티.
            </p>
            <div className="landing-actions">
              <Link
                to={loggedIn ? "/dashboard" : "/signup"}
                className="landing-primary-action"
              >
                {loggedIn ? "내 대시보드" : "동아리 지원하기"}
              </Link>
              <Link to="/about" className="landing-secondary-action">
                더 알아보기
              </Link>
            </div>
          </div>

          <div className="landing-visual" aria-hidden="true">
            <img
              className="landing-generation-mark"
              src="/brand/gen5_logo.png"
              alt=""
            />
            <img className="landing-hero-image" src={heroImage} alt="" />
            <span className="landing-visual-label">V-GENERATION</span>
          </div>
        </div>
      </section>

      <div className="landing-marquee" aria-label="주요 활동">
        <div>
          {[...ACTIVITIES, ...ACTIVITIES].map((activity, index) => (
            <span key={`${activity}-${index}`}>
              {activity} <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <section id="about" className="landing-section landing-programs">
        <div className="landing-section-heading">
          <p>WHAT WE DO</p>
          <h2>우리는 함께 성장합니다</h2>
          <span>
            배우고, 만들고, 나누는 모든 과정이 우리의 성장 경험이 됩니다.
          </span>
        </div>

        <div className="landing-program-grid">
          {PROGRAMS.map((program) => (
            <article key={program.number} className="landing-program-card">
              <span>{program.number}</span>
              <h3>{program.title}</h3>
              <p>{program.description}</p>
            </article>
          ))}
        </div>

        <div className="landing-content-links">
          <Link to="/studies">스터디 보기 →</Link>
          <Link to="/projects">프로젝트 보기 →</Link>
          <Link to="/gallery">활동 사진 보기 →</Link>
          <Link to="/calendar">일정 확인 →</Link>
        </div>
      </section>

      <section className="landing-stories">
        <div className="landing-section-heading">
          <p>MEMBER STORIES</p>
          <h2>동아리원들의 이야기</h2>
        </div>

        <div className="landing-story-grid">
          {STORIES.map((story) => (
            <article key={story.name} className="landing-story-card">
              <div className="landing-story-person">
                <span>{story.initial}</span>
                <div>
                  <strong>{story.name}</strong>
                  <small>{story.department}</small>
                </div>
              </div>
              <blockquote>“{story.quote}”</blockquote>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-join">
        <div>
          <p>JOIN US</p>
          <h2>
            함께 코딩할
            <br />
            준비가 되셨나요?
          </h2>
        </div>
        <div>
          <p>
            제 5세대와 함께 성장하세요.
            <br />
            지금 우리의 여정에 합류하세요.
          </p>
          <div className="landing-actions">
            <Link
              to={loggedIn ? "/dashboard" : "/signup"}
              className="landing-primary-action"
            >
              {loggedIn ? "대시보드 이동" : "지원하기"}
            </Link>
            <Link to="/projects" className="landing-dark-action">
              프로젝트 보기
            </Link>
          </div>
        </div>
      </section>

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
        </small>
      </footer>
    </main>
  );
}
