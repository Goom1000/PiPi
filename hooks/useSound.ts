import { useCallback, useRef, useState } from 'react';

interface UseSoundOptions {
  volume?: number;
  enabled?: boolean;
}

export function useSound(src: string, options: UseSoundOptions = {}) {
  const { volume = 1, enabled = true } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    if (!enabled) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    }

    const audio = audioRef.current;
    audio.volume = volume;
    audio.currentTime = 0;

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(err => console.warn('Audio play failed:', err));

    audio.onended = () => setIsPlaying(false);
  }, [src, volume, enabled]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return { play, stop, isPlaying };
}
