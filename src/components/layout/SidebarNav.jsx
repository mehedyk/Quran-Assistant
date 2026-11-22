import Logo from "./Logo.jsx";

// The full navigation panel (brand, every destination, How-to, language).
// Rendered in two places: the persistent, collapsible desktop sidebar
// (>=1024px) and the slide-over drawer opened by the hamburger below that.
export default function SidebarNav({ t, lang, items, activeId, navigate, onToggleLang, onHowTo }) {
  return (
    <>
      <div className="drawer-brand">
        <button type="button" className="drawer-logo-btn" onClick={() => navigate("home")}>
          <Logo size={38} />
          <span className="brand-wordmark">هادي</span>
        </button>
        <div className="drawer-tagline">{t.appTagline}</div>
      </div>
      <nav className="drawer-nav">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            className={`drawer-link ${activeId === item.id ? "active" : ""}`}
            aria-current={activeId === item.id ? "page" : undefined}
            onClick={() => navigate(item.id)}
          >
            <span className="drawer-link-icon"><item.icon size={18} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="drawer-footer">
        <button type="button" className="drawer-ctrl" onClick={onHowTo}>
          <span className="drawer-ctrl-mark">?</span> {t.howToUse}
        </button>
        <button type="button" className="drawer-ctrl" onClick={onToggleLang}>
          <span className="drawer-ctrl-mark">{lang === "bn" ? "EN" : "বাং"}</span> Language
        </button>
      </div>
    </>
  );
}
