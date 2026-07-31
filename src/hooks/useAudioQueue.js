import { useState, useRef, useEffect, useCallback } from "react";

// Each queue item: { url, key, surahNum, ayahNum, surahName }
// This hook owns exactly one <audio> element and walks through the
// queue on `ended`, so "play the whole surah" is just "build the
// queue once" — every page that wants playback (Surah page, Read
// Mode, single-ayah recite buttons) shares this one instance,
// lifted to app level, so a mini now-playing bar can render
// anywhere and per-row highlighting stays in sync no matter which
// component triggered playback.
export function useAudioQueue() {
  const [queue, setQueue]           = useState([]);
  const [currentIndex, setIndex]    = useState(-1);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const audioRef  = useRef(null);
  const queueRef  = useRef([]);
  const indexRef  = useRef(-1);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const loadAndPlay = useCallback((i) => {
    const item = queueRef.current[i];
    if (!item) { setIsPlaying(false); return; }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
    }
    const a = new Audio(item.url);
    audioRef.current = a;
    setLoading(true);
    a.oncanplaythrough = () => setLoading(false);
    a.onended = () => {
      const next = indexRef.current + 1;
      if (next < queueRef.current.length) { setIndex(next); loadAndPlay(next); }
      else { setIsPlaying(false); setIndex(-1); }
    };
    a.onerror = () => { setLoading(false); setIsPlaying(false); };
    a.play().then(() => setIsPlaying(true)).catch(() => { setLoading(false); setIsPlaying(false); });
  }, []);

  // Start (or restart) playback from a fresh list of items.
  const playQueue = useCallback((items, startIndex = 0) => {
    if (!items || items.length === 0) return;
    setQueue(items);
    queueRef.current = items;
    setIndex(startIndex);
    indexRef.current = startIndex;
    loadAndPlay(startIndex);
  }, [loadAndPlay]);

  // Back-compat convenience: play just one clip. Toggles off if the
  // same single ayah is already the only thing in the queue and playing.
  const playSingle = useCallback((item) => {
    const isSameSingle = queueRef.current.length === 1 && queueRef.current[0]?.key === item.key;
    if (isSameSingle && isPlaying) { pause(); return; }
    playQueue([item], 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playQueue, isPlaying]);

  function pause() {
    audioRef.current?.pause();
    setIsPlaying(false);
  }

  function resume() {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  }

  function togglePause() { isPlaying ? pause() : resume(); }

  function stop() {
    if (audioRef.current) { audioRef.current.onended = null; audioRef.current.pause(); }
    setIsPlaying(false);
    setIndex(-1);
    setQueue([]);
  }

  function skipNext() {
    const next = indexRef.current + 1;
    if (next < queueRef.current.length) { setIndex(next); loadAndPlay(next); }
  }

  function skipPrev() {
    const prev = indexRef.current - 1;
    if (prev >= 0) { setIndex(prev); loadAndPlay(prev); }
  }

  const current = currentIndex >= 0 ? queue[currentIndex] : null;

  return {
    // now-playing info for mini-player / highlighting
    queue, currentIndex, current, isPlaying, loading,
    total: queue.length,
    // is a given ayah key the active / up-next one right now?
    activeKey: current?.key || null,
    nextKey: (currentIndex >= 0 && queue[currentIndex + 1]) ? queue[currentIndex + 1].key : null,
    // controls
    playQueue, playSingle, pause, resume, togglePause, stop, skipNext, skipPrev,
    // legacy-shaped helpers so existing call sites (`audio.play(url)`,
    // `audio.playingUrl`) keep working without every page needing a rewrite
    play: (url) => playSingle({ url, key: url }),
    playingUrl: isPlaying ? current?.url : null,
  };
}
