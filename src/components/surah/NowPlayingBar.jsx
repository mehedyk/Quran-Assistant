export default function NowPlayingBar({ t, audio }) {
  if (!audio.current || audio.total <= 1) return null; // single-ayah plays stay silent/inline

  return (
    <div className="now-playing-bar">
      <div className="now-playing-info">
        <span className="now-playing-surah">{audio.current.surahName}</span>
        <span className="now-playing-ayah">{audio.current.key}</span>
        <span className="now-playing-progress">{audio.currentIndex + 1}/{audio.total}</span>
      </div>
      <div className="now-playing-controls">
        <button onClick={audio.skipPrev} disabled={audio.currentIndex <= 0} aria-label="Previous">⏮</button>
        <button onClick={audio.togglePause} aria-label={audio.isPlaying ? "Pause" : "Play"}>{audio.isPlaying ? "⏸" : "▶"}</button>
        <button onClick={audio.skipNext} disabled={audio.currentIndex >= audio.total-1} aria-label="Next">⏭</button>
        <button onClick={audio.stop} aria-label="Stop">✕</button>
      </div>
    </div>
  );
}
