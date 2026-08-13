import { Link } from "react-router-dom";

const VALUES = [
  {
    title: "창의성",
    description: "새로운 아이디어를 두려워하지 않고 직접 실험합니다.",
  },
  {
    title: "협업",
    description: "서로의 경험을 나누고 팀으로 더 멀리 나아갑니다.",
  },
  {
    title: "성장",
    description: "배우고 만들며 매일 조금씩 더 나은 개발자가 됩니다.",
  },
];

const HISTORY = [
  { year: "2022", title: "제 5세대 창단", description: "건국대학교 글로컬캠퍼스 IT 동아리로 첫 활동을 시작했습니다." },
  { year: "2023", title: "첫 해커톤과 프로젝트", description: "교내 해커톤 참가와 첫 실제 서비스 제작을 경험했습니다." },
  { year: "2024", title: "활동 분야 확장", description: "웹·게임·AI/ML 등 다양한 기술 스터디와 프로젝트를 운영했습니다." },
  { year: "2025", title: "프로젝트 성과 공유", description: "완성한 프로젝트를 발표하고 동아리 안팎으로 경험을 나눴습니다." },
  { year: "2026", title: "공식 웹사이트 오픈", description: "활동 기록과 부원 성장을 연결하는 새로운 홈페이지를 열었습니다." },
];

/** 동아리 소개와 CI를 안내하는 공개 페이지 */
export function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy">
          <p>ABOUT GEN5</p>
          <h1>
            함께 코딩하고,
            <br />
            함께 성장합니다
          </h1>
          <span>
            제 5세대는 건국대학교 글로컬캠퍼스 중앙동아리 창업학술분과
            소속 IT 동아리입니다.
          </span>
          <div className="about-actions">
            <Link to="/signup">동아리 지원하기</Link>
            <Link to="/projects">프로젝트 보기</Link>
          </div>
        </div>
        <div className="about-hero-brand">
          <img src="/brand/gen5_main_CI.png" alt="제 5세대 CI" />
        </div>
      </section>

      <section className="about-section about-profile">
        <div className="about-section-heading">
          <p>OUR CLUB</p>
          <h2>제 5세대를 소개합니다</h2>
        </div>
        <dl className="about-profile-list">
          <div>
            <dt>소속</dt>
            <dd>건국대학교 글로컬캠퍼스 중앙동아리 창업학술분과</dd>
          </div>
          <div>
            <dt>활동</dt>
            <dd>프로그래밍 스터디, 웹·게임·소프트웨어 프로젝트, 월간 발표회</dd>
          </div>
          <div>
            <dt>동아리실</dt>
            <dd>건국대학교 글로컬캠퍼스 학생회관 423호</dd>
          </div>
        </dl>
      </section>

      <section className="about-section">
        <div className="about-section-heading">
          <p>OUR VALUES</p>
          <h2>우리가 중요하게 생각하는 것</h2>
        </div>
        <div className="about-value-grid">
          {VALUES.map((value, index) => (
            <article key={value.title}>
              <span>0{index + 1}</span>
              <h3>{value.title}</h3>
              <p>{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section about-history">
        <div className="about-section-heading">
          <p>HISTORY</p>
          <h2>제 5세대가 걸어온 길</h2>
        </div>
        <ol>
          {HISTORY.map((item) => (
            <li key={item.year}>
              <strong>{item.year}</strong>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-section about-identity">
        <div className="about-identity-copy">
          <div className="about-section-heading">
            <p>BRAND IDENTITY</p>
            <h2>연결과 성장을 담은 CI</h2>
          </div>
          <p>
            역동적인 사선과 연결된 형태는 IT 기술로 사람과 아이디어를 잇고 함께
            성장하는 제 5세대를 상징합니다.
          </p>
          <div className="about-colors" aria-label="제 5세대 대표 색상">
            <span style={{ background: "#00c060" }}>#00C060</span>
            <span style={{ background: "#111827" }}>#111827</span>
            <span className="light" style={{ background: "#e8f7e8" }}>#E8F7E8</span>
          </div>
          <a className="about-download" href="/brand/gen5_CI.zip" download>
            CI 패키지 다운로드
          </a>
        </div>
        <img
          className="about-ci-guide"
          src="/brand/CI.png"
          alt="제 5세대 CI와 색상 가이드"
        />
      </section>
    </main>
  );
}
