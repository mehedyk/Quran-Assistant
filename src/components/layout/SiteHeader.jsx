import { useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import SidebarNav from "./SidebarNav.jsx";

// Top navigation from the Figma "Navigation" frame:
//   wordmark + descriptor · six primary links · Saved button · language.
// Navigation also lives in the collapsible sidebar (>=1024px, toggle button
// in this header, state saved in localStorage as before). Below 1024px the
// links collapse into a slide-over drawer (hamburger) holding the same panel:
// every destination, "How to use" and the language switch.
const PRIMARY_IDS = ["home", "search", "surah-browser", "book", "journey", "ask"];

export default function SiteHeader({
  t, lang, items, activeId, navigate, onToggleLang, onHowTo,
  drawerOpen, onToggleDrawer, onCloseDrawer,
  sidebarCollapsed, onToggleSidebar,
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
              className="sidebar-toggle"
              onClick={onToggleSidebar}
              aria-label={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-controls="app-sidebar"
              title={sidebarCollapsed ? t.expandSidebar : t.collapseSidebar}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} strokeWidth={1.5} /> : <PanelLeftClose size={20} strokeWidth={1.5} />}
            </button>
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
          <SidebarNav
            t={t} lang={lang} items={items} activeId={activeId} navigate={navigate}
            onToggleLang={onToggleLang}
            onHowTo={() => { onCloseDrawer(); onHowTo(); }}
          />
        </aside>
      )}
    </>
  );
}
