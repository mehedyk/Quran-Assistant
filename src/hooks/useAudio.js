import { useState, useRef, useEffect } from "react";

export function useAudio() {
  const [playingUrl, setPlayingUrl] = useState(null);
  const [loading, setLoading]       = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  function play(url) {
    if (playingUrl === url) {
      // Toggle off
      audioRef.current?.pause();
      setPlayingUrl(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(url);
    audioRef.current = a;
    setLoading(true);
    a.oncanplaythrough = () => setLoading(false);
    a.onended = () => setPlayingUrl(null);
    a.onerror = () => { setPlayingUrl(null); setLoading(false); };
    a.play().then(() => setPlayingUrl(url)).catch(() => setLoading(false));
  }

  function stop() {
    audioRef.current?.pause();
    setPlayingUrl(null);
  }

  return { play, stop, playingUrl, loading };
}
