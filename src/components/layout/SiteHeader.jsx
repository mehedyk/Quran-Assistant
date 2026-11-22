import { useEffect } from "react";
import Logo from "./Logo.jsx";

// Top navigation from the Figma "Navigation" frame:
//   wordmark + descriptor · six primary links · Saved button · language.
// Below 1024px the six links collapse into a menu drawer (hamburger),
// which also carries every remaining destination (Saved, About), the
// "How to use" guide and the language switch — so nothing the old sidebar
// offered is lost at any width.
const PRIMARY_IDS = ["home", "search", "surah-browser", "book", "journey", "ask"];

export default function SiteHeader({
  t, lang, items, activeId, navigate, onToggleLang, onHowTo,
  drawerOpen, onToggleDrawer, onCloseDrawer,
}) {
  const primary = PRIMARY_IDS.map(id => items.find(i => i.id === id)).filter(Boolean);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = e => { if (e.key === "Escape") onCloseDrawer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, onCloseDrawer]);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <button
            type="button"
            className={`hamburger ${drawerOpen ? "hamburger-open" : ""}`}
            onClick={onToggleDrawer}
            aria-label={drawerOpen ? t.closeMenu : t.openMenu}
            aria-expanded={drawerOpen}
            aria-controls="site-drawer"
          >
            <span /><span /><span />
          </button>

          <button type="button" className="brand" onClick={() => navigate("home")} aria-label="Hadi — home">
            <span className="brand-wordmark">هادي</span>
            <span className="brand-descriptor">{t.brandDescriptor}</span>
          </button>

          <nav className="primary-nav" aria-label="Primary">
            {primary.map(item => (
              <button
                key={item.id}
                type="button"
                className={`primary-link ${activeId === item.id ? "active" : ""}`}
                aria-current={activeId === item.id ? "page" : undefined}
                onClick={() => navigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className={`saved-btn ${activeId === "bookmarks" ? "active" : ""}`}
              aria-current={activeId === "bookmarks" ? "page" : undefined}
              onClick={() => navigate("bookmarks")}
            >
              {t.saved}
            </button>
            <button type="button" className="lang-toggle" onClick={onToggleLang} aria-label={t.langToggle}>
              <span className={lang === "bn" ? "on" : ""}>বাং</span>
              <span className="lang-sep"> / </span>
              <span className={lang === "en" ? "on" : ""}>EN</span>
            </button>
          </div>
        </div>
      </header>

      {drawerOpen && <div className="drawer-scrim" onClick={onCloseDrawer} />}
      {drawerOpen && (
        <aside className="drawer" id="site-drawer" aria-label="Menu">
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
                onClick={() => navigate(item.id)}
              >
                <span className="drawer-link-icon"><item.icon size={18} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="drawer-footer">
            <button type="button" className="drawer-ctrl" onClick={() => { onCloseDrawer(); onHowTo(); }}>
              <span className="drawer-ctrl-mark">?</span> {t.howToUse}
            </button>
            <button type="button" className="drawer-ctrl" onClick={onToggleLang}>
              <span className="drawer-ctrl-mark">{lang === "bn" ? "EN" : "বাং"}</span> Language
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
