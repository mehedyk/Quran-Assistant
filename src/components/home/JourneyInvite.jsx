import { Check } from "lucide-react";

// Figma "Reading journey" invitation -> the Journey page.
export default function JourneyInvite({ t, navigate }) {
  return (
    <section className="home-section journey-section" aria-labelledby="journey-invite-title">
      <div className="journey-invite">
        <div className="journey-invite-copy">
          <span className="eyebrow">{t.journeyEyebrow}</span>
          <h2 id="journey-invite-title" className="journey-invite-title">{t.journeyHeadline}</h2>
          <p className="journey-invite-desc">{t.journeyDesc}</p>
        </div>
        <button type="button" className="btn-accent journey-invite-cta" onClick={() => navigate("journey")}>
          {t.journeyCta}
        </button>
        <ul className="journey-benefits">
          {[t.versesRead, t.daysActive, t.pinnedVerses].map(b => (
            <li key={b}><Check size={16} strokeWidth={1.5} aria-hidden />{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
