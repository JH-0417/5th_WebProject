import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "2026년 11월 12일";

/** 개인정보 처리방침 (공개 페이지) */
export function PrivacyPage() {
  return (
    <main className="page">
      <article className="card card-wide card-read privacy-page">
        <h1>개인정보 처리방침</h1>
        <p className="subtitle">
          제 5세대(건국대학교 글로컬캠퍼스 IT 동아리)는 회원의 개인정보를 소중히
          다루며, 동아리 운영에 꼭 필요한 정보만 수집합니다. 시행일: {EFFECTIVE_DATE}
        </p>

        <nav className="privacy-toc" aria-label="목차">
          <a href="#collect">1. 수집 항목</a>
          <a href="#purpose">2. 이용 목적</a>
          <a href="#retention">3. 보유 기간과 파기</a>
          <a href="#withdraw">4. 회원 탈퇴</a>
          <a href="#outsourcing">5. 처리 위탁</a>
          <a href="#rights">6. 회원의 권리</a>
          <a href="#security">7. 안전성 확보 조치</a>
          <a href="#contact">8. 문의</a>
        </nav>

        <section id="collect" className="privacy-section">
          <h2>1. 수집하는 개인정보 항목</h2>
          <table className="privacy-table">
            <thead>
              <tr>
                <th scope="col">구분</th>
                <th scope="col">항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">가입 신청 (필수)</th>
                <td>
                  아이디, 비밀번호(암호화하여 저장), 이름, 학번, 학과, 학년,
                  휴대폰 번호, 이메일, 지원 사유, 희망 활동
                </td>
              </tr>
              <tr>
                <th scope="row">프로필 (선택)</th>
                <td>GitHub 사용자명, 자기소개, 기술 스택</td>
              </tr>
              <tr>
                <th scope="row">활동 기록</th>
                <td>프로젝트·스터디 참여 및 가입 신청 내역, 동아리 직책</td>
              </tr>
              <tr>
                <th scope="row">자동 생성</th>
                <td>
                  로그인 유지용 토큰(원문이 아닌 암호화된 값만 저장). 로그인 실패
                  횟수 제한을 위한 IP 주소는 서버 메모리에서만 잠시 사용하며
                  저장하지 않습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="purpose" className="privacy-section">
          <h2>2. 개인정보의 이용 목적</h2>
          <ul>
            <li>가입 신청 심사 및 본인 확인</li>
            <li>회원 관리, 로그인 및 부정 이용 방지</li>
            <li>프로젝트·스터디 운영, 멤버 소개, 동아리 일정·공지 안내</li>
          </ul>
          <p>수집한 정보는 위 목적 외의 용도로 이용하거나 제3자에게 제공하지 않습니다.</p>
        </section>

        <section id="retention" className="privacy-section">
          <h2>3. 보유 기간과 파기</h2>
          <ul>
            <li>
              <strong>회원 탈퇴 시 즉시 삭제합니다.</strong> 회원 정보, 로그인
              유지 토큰, 프로젝트·스터디 참여 내역이 함께 지워집니다.
            </li>
            <li>가입 신청이 거절된 경우 관리자가 지체 없이 삭제합니다.</li>
            <li>
              회원이 작성한 공지·FAQ·일정과 올린 활동 사진은 동아리 기록으로
              남지만, 작성자와의 연결은 끊어져 누가 작성했는지 표시되지 않습니다.
            </li>
          </ul>
        </section>

        <section id="withdraw" className="privacy-section">
          <h2>4. 회원 탈퇴 방법</h2>
          <p>
            로그인 후 <Link to="/mypage">마이페이지</Link> 하단의 “회원 탈퇴”에서
            비밀번호를 확인하면 바로 탈퇴되며, 개인정보는 즉시 삭제되어 복구할 수
            없습니다. 최고관리자는 다른 관리자에게 권한을 넘긴 뒤 탈퇴할 수
            있습니다.
          </p>
        </section>

        <section id="outsourcing" className="privacy-section">
          <h2>5. 개인정보 처리 위탁</h2>
          <p>사이트 운영을 위해 아래 외부 서비스를 이용하며, 데이터가 해외 서버에 저장될 수 있습니다.</p>
          <table className="privacy-table">
            <thead>
              <tr>
                <th scope="col">서비스</th>
                <th scope="col">위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Neon</th>
                <td>회원 정보 등 데이터베이스 보관</td>
              </tr>
              <tr>
                <th scope="row">Render</th>
                <td>백엔드 서버 운영</td>
              </tr>
              <tr>
                <th scope="row">Vercel</th>
                <td>웹사이트 화면 제공</td>
              </tr>
              <tr>
                <th scope="row">Cloudinary</th>
                <td>공지·갤러리 이미지 보관</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="rights" className="privacy-section">
          <h2>6. 회원의 권리</h2>
          <ul>
            <li>
              언제든지 <Link to="/me/edit">내 정보 수정</Link>에서 자신의 정보를
              확인·수정할 수 있습니다.
            </li>
            <li>개인정보 수집·이용 동의를 철회하려면 회원 탈퇴를 하면 됩니다.</li>
          </ul>
        </section>

        <section id="security" className="privacy-section">
          <h2>7. 안전성 확보 조치</h2>
          <ul>
            <li>비밀번호는 bcrypt로 암호화하여 저장하며, 운영진도 원문을 알 수 없습니다.</li>
            <li>로그인 유지 토큰은 해시값만 저장하고, 비밀번호 변경 시 모두 폐기합니다.</li>
            <li>로그인 실패가 반복되면 일정 시간 로그인을 제한합니다.</li>
            <li>비로그인 방문자에게는 학번을 가려서 보여 줍니다.</li>
          </ul>
        </section>

        <section id="contact" className="privacy-section">
          <h2>8. 개인정보 관련 문의</h2>
          <p>
            개인정보 보호책임자: 제 5세대 회장
            <br />
            연락처: 건국대학교 글로컬캠퍼스 학생회관 423호 (동아리방)
          </p>
          <p className="muted">
            이 방침이 바뀌면 시행 7일 전부터 공지사항을 통해 알립니다.
          </p>
        </section>

        <p className="switch-link">
          <Link to="/">홈으로 돌아가기</Link>
        </p>
      </article>
    </main>
  );
}
