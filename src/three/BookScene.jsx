import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { BookSceneEngine } from "./BookSceneEngine.js";

/**
 * Mounts a BookSceneEngine into a canvas and owns its lifecycle: creates it
 * on mount, disposes it on unmount (critical — this app navigates between
 * many pages, unlike the original single-page demo, so a leaked WebGL
 * context per visit to Read Mode/Book Library would be a real problem).
 *
 * Props:
 *  - books: full descriptor array (see textures.js header for shape)
 *  - onSelectionChange(index): shelf selection changed
 *  - onDetailChange(book, spread, readingOpen): open book / page / reading state changed
 *      — drives Phase 2's accessible DOM mirror, translation-toggle chrome, and page nav buttons
 *  - onClosed(): book returned to the shelf
 *
 * Imperative handle (via ref): openDetail(), closeDetail(), turnPage(dir),
 * setDetailPanelBounds(rect) — so a wide-screen side panel (translation
 * text, bookmark/share controls) can tell the engine to keep the book
 * clear of it, and setSelectedIndex(index) to pick a surah before opening.
 */
export const BookScene = forwardRef(function BookScene({ books, onSelectionChange, onDetailChange, onClosed }, ref) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    const engine = new BookSceneEngine(canvasRef.current, {
      books,
      onSelectionChange,
      onDetailChange,
      onClosed
    });
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- engine owns book list for its lifetime; see note below
  }, []);

  // HADI note: `books` is intentionally not a dependency above — rebuilding
  // the whole WebGL scene every time the surah list array reference changes
  // would be wasteful and would drop mid-interaction state. If the book
  // list can change after mount (e.g. switching between "surah" and "juz"
  // grouping), call a dedicated engine.setBooks(books) method instead of
  // relying on this effect — not yet implemented, flagged for Phase 3.

  useImperativeHandle(ref, () => ({
    openDetail: () => engineRef.current?.openDetail(),
    closeDetail: () => engineRef.current?.closeDetail(),
    turnPage: (direction) => engineRef.current?.turnPage(direction),
    setReadingOpen: (open) => engineRef.current?.setReadingOpen(open),
    setSelectedIndex: (index) => engineRef.current?.updateSelection(index, true),
    navigate: (direction) => engineRef.current?.navigate(direction),
    setDetailPanelBounds: (rect) => engineRef.current?.setDetailPanelBounds(rect)
  }), []);

  return (
    <canvas
      ref={canvasRef}
      className="book-scene-canvas"
      style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
      aria-hidden="true"
    />
  );
});
