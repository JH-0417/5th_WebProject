import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getAccessToken } from "../api/auth";
import { useRecruitment } from "../utils/useRecruitmentOpen";

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

/** 누구나 접근할 수 있는 메인 랜딩 페이지 */
export function LandingPage() {
  const loggedIn = Boolean(getAccessToken());
  const recruitment = useRecruitment();
  // 불러오기 전(null)에는 기존처럼 지원 링크를 보여 주고, 닫힘이 확인되면 마감 표시
  const recruitmentClosed = recruitment?.is_open === false;
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // 스크롤에 따라 배경 영상은 천천히 확대·이동, 문구는 서서히 사라지는 패럴랙스
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(
        Math.max(window.scrollY / Math.max(hero.offsetHeight, 1), 0),
        1,
      );
      hero.style.setProperty("--hero-scroll", progress.toFixed(4));

      // 밝은 시트가 화면 아래에서 올라오며 양옆으로 넓어지는 정도 (0 → 1)
      const sheet = sheetRef.current;
      if (sheet) {
        const top = sheet.getBoundingClientRect().top;
        const vh = window.innerHeight;
        const enter = Math.min(Math.max((vh - top) / (vh * 0.75), 0), 1);
        sheet.style.setProperty("--sheet-in", enter.toFixed(4));
      }
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
  }, []);

  // React는 muted를 HTML 속성으로 내보내지 않아 일부 브라우저(iOS Safari 등)에서
  // 자동재생이 막히므로 직접 지정한 뒤 재생을 시도한다.
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <main className="landing">
      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero-media" aria-hidden="true">
          <video
            ref={heroVideoRef}
            className="landing-hero-video"
            src="/home.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="landing-hero-overlay" />
        </div>

        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <p className="landing-hero-badge">
              <span aria-hidden="true" />
              중앙동아리 창업학술분과 | 건국대학교 글로컬캠퍼스
            </p>
            <h1 aria-label="제 5세대">
              {Array.from("제 5세대").map((char, index) => (
                <span
                  key={index}
                  className="landing-hero-char"
                  style={{ animationDelay: `${0.25 + index * 0.07}s` }}
                  aria-hidden="true"
                >
                  {char === " " ? "\u00a0" : char}
                </span>
              ))}
            </h1>
            <p className="landing-hero-subtitle">Konkuk Univ. IT Club</p>
            <p className="landing-hero-description">
              함께 코딩하고, 함께 성장하는 공간.
              <br />
              아이디어를 현실로 만드는 개발자들의 커뮤니티.
            </p>
            <div className="landing-actions">
              {!loggedIn && recruitmentClosed ? (
                <span className="landing-primary-action is-disabled" aria-disabled="true">
                  지금은 모집 기간이 아닙니다
                </span>
              ) : (
                <Link
                  to={loggedIn ? "/mypage" : "/signup"}
                  className="landing-primary-action"
                >
                  {loggedIn ? "마이페이지" : "동아리 지원하기"}
                </Link>
              )}
              <Link to="/about" className="landing-secondary-action">
                더 알아보기
              </Link>
            </div>
          </div>
        </div>

        <div className="landing-scroll-hint" aria-hidden="true">
          <span>스크롤</span>
          <i>↓</i>
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

      <div className="landing-sheet" ref={sheetRef}>
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
      </div>

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
            {!loggedIn && recruitmentClosed ? (
              <span className="landing-primary-action is-disabled" aria-disabled="true">
                모집 마감
              </span>
            ) : (
              <Link
                to={loggedIn ? "/mypage" : "/signup"}
                className="landing-primary-action"
              >
                {loggedIn ? "마이페이지 이동" : "지원하기"}
              </Link>
            )}
            <Link to="/projects" className="landing-dark-action">
              프로젝트 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
