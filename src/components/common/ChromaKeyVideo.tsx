import { useEffect, useRef } from 'react';
import type { CharacterKey } from '../../data/characters';

// Per-character keying thresholds tuned against the source studio footage.
// Each set was calibrated manually: minC/sat target the near-white backdrop
// while leaving the figurine's clothing and skin tones untouched.
const KEYING_CONFIG: Record<
  CharacterKey,
  { minCThreshold: number; satThreshold: number; cutoff: number; slope: number }
> = {
  shark:  { minCThreshold: 180, satThreshold: 32, cutoff: 215, slope: 7.5 },
  cactus: { minCThreshold: 155, satThreshold: 38, cutoff: 185, slope: 8.5 },
  racoon: { minCThreshold: 165, satThreshold: 35, cutoff: 200, slope: 8.0 },
  ducky:  { minCThreshold: 125, satThreshold: 38, cutoff: 175, slope: 5.1 },
};

// Ducky has a noticeable jump cut at loop boundary — fade the opacity window
// over 450 ms at both the start and end of playback to smooth it out.
const DUCKY_FADE_SEC = 0.45;

interface Props {
  src: string;
  keyColor: CharacterKey;
  isActive: boolean;
  className?: string;
}

export default function ChromaKeyVideo({ src, keyColor, isActive, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const cfg = KEYING_CONFIG[keyColor];
    let raf: number;

    function tick() {
      raf = requestAnimationFrame(tick);

      if (!ctx) return;

      // Suspend processing while this character is offscreen.
      if (!isActive) {

        if (!video!.paused) video!.pause();
        return;
      }

      if (video!.paused && !video!.ended) {
        video!.play().catch(() => {/* autoplay policy — silently ignore */});
      }

      if (video!.paused || video!.ended || !video!.videoWidth) return;

      // Downsample to 540 px wide before keying — this cuts pixel-loop
      // iterations from ~8 M to ~1.2 M per frame (~1.5 ms on mid-range hw).
      const targetW = Math.min(540, video!.videoWidth);
      const targetH = Math.round((targetW / video!.videoWidth) * video!.videoHeight);

      if (canvas!.width !== targetW || canvas!.height !== targetH) {
        canvas!.width  = targetW;
        canvas!.height = targetH;
      }

      ctx.drawImage(video!, 0, 0, targetW, targetH);

      const frame = ctx.getImageData(0, 0, targetW, targetH);
      const d = frame.data;

      // Compute Ducky's seamless-loop fade multiplier once per frame.
      let loopFade = 1;
      if (keyColor === 'ducky' && video!.duration > 0) {
        const t = video!.currentTime;
        const dur = video!.duration;
        if (t < DUCKY_FADE_SEC)           loopFade = t / DUCKY_FADE_SEC;
        else if (t > dur - DUCKY_FADE_SEC) loopFade = (dur - t) / DUCKY_FADE_SEC;
        loopFade = Math.max(0, loopFade);
      }

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat  = maxC - minC;

        // Near-white backdrop removal — pixels inside the unsaturated band
        // above minCThreshold get pushed toward transparent. Pixels above
        // cutoff are fully transparent; the zone below uses a linear ramp
        // so edges blend rather than alias.
        if (minC > cfg.minCThreshold && sat < cfg.satThreshold) {
          if (minC > cfg.cutoff) {
            d[i + 3] = 0;
          } else {
            const edge = Math.round((cfg.cutoff - minC) * cfg.slope);
            d[i + 3] = Math.min(d[i + 3], Math.max(0, Math.min(255, edge)));
          }
        }

        // Apply Ducky loop fade after keying so the ramp respects the
        // transparency we already wrote above.
        if (loopFade < 1 && d[i + 3] > 0) {
          d[i + 3] = Math.round(d[i + 3] * loopFade);
        }
      }

      ctx.putImageData(frame, 0, 0);
    }

    tick();
    return () => cancelAnimationFrame(raf);
  }, [src, keyColor, isActive]);

  return (
    <div className={`relative ${className ?? ''}`}>
      {/* Hidden video — only used as a pixel source for the canvas above */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="hidden"
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
}
