// 맨 아래 사이트 정보 (운영자 · 이메일 · 인스타그램)
import footerLogo from "../../assets/footer-logo.png";

export default function SiteFooter() {
  return <footer className="sitefoot" aria-label="사이트 정보"><div className="w">
    <img className="flogo" src={footerLogo} alt="혼디모영" width="40" />
    <div className="finfo">
      <p className="fname"><strong>혼디모영</strong> (hondi-moyeong)</p><p className="fmail"><strong>이메일</strong> moyeonghondi@gmail.com</p>
      <p className="fcopy">© 2026 hondi-moyeong. All rights reserved.</p>
    </div>
    <a className="insta" href="https://www.instagram.com/moyeonghondi?exln=a3o0bDJrYnJ2eHVt" target="_blank" rel="noopener" aria-label="혼디모영 인스타그램 (새 창)">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
    </a>
  </div></footer>;
}
