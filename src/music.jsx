import React, { useState, useRef, useEffect } from 'react';
import './music.css';

function Music({ previewUrl, quessCounter, onPrevDay, onNextDay, disableNext, disablePrev }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);

  const allowedDurations = [0.5, 1, 3, 5, 10, 30];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
  }, [quessCounter, previewUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const maxTime = allowedDurations[quessCounter] ?? allowedDurations.at(-1);

    const interval = setInterval(() => {
      if (audio.currentTime >= maxTime) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [quessCounter, isPlaying]);

  function togglePlay() {
    const audio = audioRef.current;

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    setProgress((audio.currentTime / audio.duration) * 100);
  }

  function handleSeek(e) {
    const audio = audioRef.current;
    const value = e.target.value;
    audio.currentTime = (value / 100) * audio.duration;
    setProgress(value);
  }

  function handleVolume(e) {
    const audio = audioRef.current;
    const value = e.target.value;
    audio.volume = value;
    setVolume(value);
  }

  return (
    <div className="player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        src={previewUrl}
      />

      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={handleSeek}
        className="timeline"
      />

      <div className="controls">

        <button onClick={onNextDay} disabled={disableNext}>⬅</button>

        <button onClick={togglePlay} className="playBtn">
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        <button onClick={onPrevDay} disabled={disablePrev}>➡</button>

      </div>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolume}
        className="volume"
      />
    </div>
  );
}

export default Music;
