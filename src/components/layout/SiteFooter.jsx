// Footer from the Figma "Footer" frame. "About" and "How to use" live here
// in the design; the original footer's copyright, purpose line and MIT
// licence link are all kept.
export default function SiteFooter({ t, navigate, onHowTo }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="brand-wordmark footer-wordmark">هادي</span>
            <span className="footer-mission">{t.footerMission}</span>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <button type="button" onClick={() => navigate("about")}>{t.about}</button>
            <button type="button" onClick={onHowTo}>{t.howToUse}</button>
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© {new Date().getFullYear()} Hadi Quran Reference</span>
          <span className="footer-purpose">{t.footerPurpose}</span>
          <a className="footer-license" href="https://github.com/mehedyk/hadi-quran" target="_blank" rel="noopener noreferrer">MIT License</a>
        </div>
      </div>
    </footer>
  );
}
