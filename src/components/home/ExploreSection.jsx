import { Search, BookOpen, Bookmark, HelpCircle } from "lucide-react";

// Figma "Explore Hadi": four feature cards. They reach the same pages the
// original home cards did (search, saved, ask) and the Read Mode library;
// the Surah browser stays one tap away via the header, the hero button and
// the carousel's "all surahs" link.
export default function ExploreSection({ t, navigate }) {
  const cards = [
    { id: "search",    icon: Search,     title: t.wordSearch, desc: t.exploreSearchDesc },
    { id: "book",      icon: BookOpen,   title: t.readMode,   desc: t.exploreReadDesc },
    { id: "bookmarks", icon: Bookmark,   title: t.savedAyat,  desc: t.exploreSavedDesc },
    { id: "ask",       icon: HelpCircle, title: t.askTitle,   desc: t.exploreAskDesc },
  ];
  return (
    <section className="home-section explore-section" aria-labelledby="explore-title">
      <h2 id="explore-title" className="section-heading">{t.exploreTitle}</h2>
      <p className="section-subtitle">{t.exploreSub}</p>
      <div className="explore-grid">
        {cards.map(c => (
          <button key={c.id} type="button" className="explore-card" onClick={() => navigate(c.id)}>
            <c.icon size={25} strokeWidth={1.5} className="explore-icon" aria-hidden />
            <span className="explore-title">{c.title}</span>
            <span className="explore-desc">{c.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
