import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import ChromaKeyVideo from '../common/ChromaKeyVideo';
import { CHARACTERS } from '../../data/characters';

// The loader won't disappear before MIN_DISPLAY_MS regardless of
// network speed — gives the user time to actually see it.
const MIN_DISPLAY_MS   = 3000;
const PRELOAD_TIMEOUT_MS = 8000;

interface Props {
  onGoHome?: () => void;
}

export default function NotFoundPage({ onGoHome }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scaleY, setScaleY]           = useState(1);
  const [isLoading, setIsLoading]     = useState(true);
  const [loaded, setLoaded]           = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CHARACTERS.map((c) => [c.id, false]))
  );

  const watermarkRef  = useRef<HTMLDivElement>(null);
  const touchStartX   = useRef<number | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout>>();

  const active = CHARACTERS[activeIndex];

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const next = useCallback(() =>
    setActiveIndex((i) => (i + 1) % CHARACTERS.length), []);

  const prev = useCallback(() =>
    setActiveIndex((i) => (i + CHARACTERS.length - 1) % CHARACTERS.length), []);

  // ─── Parallel video pre-buffering ─────────────────────────────────────────
  // We spin up one hidden <video> element per character and listen for
  // canplaythrough. Once all assets are buffered we dismiss the loader.
  // onerror counts as "done" so a broken asset never blocks the UI forever.

  useEffect(() => {
    const startedAt = Date.now();
    let readyCount  = 0;

    // Dismiss only after both conditions are met:
    //   1. all assets have fired canplaythrough (or errored)
    //   2. at least MIN_DISPLAY_MS ms have passed since mount
    function dismiss() {
      const elapsed   = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }

    function markReady(id: string) {
      setLoaded((prev) => {
        if (prev[id]) return prev;
        readyCount += 1;
        if (readyCount >= CHARACTERS.length) {
          clearTimeout(fallbackTimer.current);
          dismiss();
        }
        return { ...prev, [id]: true };
      });
    }

    const videos = CHARACTERS.map((char) => {
      const v = document.createElement('video');
      v.src         = char.src;
      v.preload     = 'auto';
      v.muted       = true;
      v.playsInline = true;
      v.oncanplaythrough = () => markReady(char.id);
      v.onerror          = () => markReady(char.id);
      v.load();
      return v;
    });

    fallbackTimer.current = setTimeout(dismiss, PRELOAD_TIMEOUT_MS);

    return () => {
      clearTimeout(fallbackTimer.current);
      videos.forEach((v) => { v.src = ''; v.load(); });
    };
  }, []);

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [next, prev]);

  // ─── Touch / swipe navigation ─────────────────────────────────────────────

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx > 0 ? prev() : next();
    touchStartX.current = null;
  }

  // ─── Watermark vertical scale ─────────────────────────────────────────────
  // The giant "404" text is stretched vertically to fill the viewport height.
  // We compute the scale factor from the natural rendered height of the element.

  useEffect(() => {
    function update() {
      const h = watermarkRef.current?.offsetHeight;
      if (h) setScaleY((window.innerHeight / h) * 1.4);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ─── Home navigation ──────────────────────────────────────────────────────

  function goHome(e: React.MouseEvent) {
    e.preventDefault();
    if (onGoHome) {
      onGoHome();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  }

  // ─── Derived values ───────────────────────────────────────────────────────

  const loadedCount     = Object.values(loaded).filter(Boolean).length;
  const progressPercent = Math.round((loadedCount / CHARACTERS.length) * 100);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden px-3 py-3 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] sm:px-6 sm:py-5 md:px-10"
      style={{ background: active.bgGradient, fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Preloader overlay ─────────────────────────────────────────────── */}
      <div
        aria-hidden={!isLoading}
        className={[
          'fixed inset-0 z-50 overflow-hidden bg-[#060608]',
          'transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isLoading
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
      >
        {/* Massive stroke "404" background — pure editorial typography */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        >
          <span
            className="font-black leading-none tracking-tighter text-transparent"
            style={{
              fontSize: 'clamp(180px, 38vw, 680px)',
              WebkitTextStroke: '1.5px rgba(255,255,255,0.055)',
            }}
          >
            404
          </span>
        </div>

        {/* Subtle center radial — just barely lifts the mid zone */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.045) 0%, transparent 70%)',
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-7 pt-7 sm:px-12 sm:pt-10">
          <span className="text-base font-black uppercase tracking-[0.12em] text-white/90">
            AJESUS
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
            LOADING ASSETS
          </span>
        </div>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-6 sm:gap-14">
          {/* Wordmark */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-black uppercase tracking-[0.04em] text-white sm:text-5xl">
              AJESUS 3D
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/30 sm:text-xs">
              SYNCHRONIZING FIGURINE CAROUSEL
            </p>
          </div>
        </div>

        {/* Bottom progress — razor-thin line pinned to the floor */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="flex items-center justify-between px-7 pb-3 sm:px-12">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/20">
              BUFFERING
            </span>
            <span className="font-mono text-[9px] tabular-nums tracking-wider text-white/30">
              {progressPercent}%
            </span>
          </div>
          {/* The line itself */}
          <div className="h-px w-full bg-white/6">
            <div
              className="h-full bg-white/70 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── SVG film-grain overlay ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* ── Background 404 watermark + oval ──────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden items-center justify-center sm:flex"
        style={{
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 98%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 98%)',
        }}
      >
        <div className="relative flex items-center justify-center">
          <div
            ref={watermarkRef}
            className={`select-none whitespace-nowrap font-black leading-none tracking-tighter transition-colors duration-700 ${active.watermarkTextColor}`}
            style={{
              fontSize: 'clamp(200px, 48vw, 800px)',
              transform: `scale(1.15, ${scaleY})`,
            }}
          >
            404
          </div>
          <div
            className="absolute h-[22vh] rounded-full bg-[#FAF7F2]/90 shadow-[0_20px_60px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:h-[26vh] md:h-[50vh]"
            style={{
              width: 'clamp(120px, 20vw, 400px)',
              transform: `scaleY(${scaleY})`,
              transformOrigin: 'center',
            }}
          />
        </div>
      </div>

      {/* ── Top navigation ────────────────────────────────────────────────── */}
      <header className="relative z-30 mx-auto flex w-full max-w-6xl items-center justify-between pt-1 sm:justify-center sm:pt-0">
        {/* Mobile header */}
        <div className="flex w-full items-center justify-between px-2 pt-1 sm:hidden">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black tracking-tighter text-[#0F172A]">404</span>
            <span className="flex items-center gap-1 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#334155] backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-500" />
              AJESUS
            </span>
          </div>
          <span className="rounded-full border border-white/80 bg-white/60 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#0F172A] backdrop-blur-md">
            {active.name}
          </span>
        </div>

        {/* Desktop character selector pill */}
        <div className="hidden items-center gap-1.5 rounded-full border border-white/90 bg-white/75 px-5 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:flex">
          {CHARACTERS.map((char, i) => {
            const Icon     = char.icon;
            const isCurrent = i === activeIndex;
            return (
              <button
                key={char.id}
                onClick={() => setActiveIndex(i)}
                className={[
                  'flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300',
                  isCurrent
                    ? 'scale-105 bg-[#0F172A] text-white shadow-md'
                    : 'text-[#1E293B] hover:scale-105 hover:bg-[#0F172A] hover:text-white active:scale-95',
                ].join(' ')}
              >
                <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'text-white' : char.iconColor}`} />
                {char.name}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Character carousel ────────────────────────────────────────────── */}
      <div
        aria-live="polite"
        aria-label="3D character carousel"
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
      >
        {CHARACTERS.map((char, i) => {
          const isCurrent = i === activeIndex;
          const tx = isCurrent ? '0vw' : i < activeIndex ? '-75vw' : '75vw';

          return (
            <div
              key={char.id}
              className="absolute flex h-[85vh] w-[120vw] items-center justify-center transition-all duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)] sm:h-[70vh] sm:w-[70vw] md:h-[78vh] md:w-[62vw]"
              style={{
                transform:  `translate3d(${tx}, 0, 0) scale(${isCurrent ? 1 : 0.85})`,
                opacity:    isCurrent ? 1 : 0,
                zIndex:     isCurrent ? 20 : 10,
                willChange: 'transform, opacity',
              }}
            >
              <ChromaKeyVideo
                src={char.src}
                keyColor={char.id}
                isActive={isCurrent}
                className="h-full w-full"
              />
            </div>
          );
        })}
      </div>

      {/* ── Bottom control bar ────────────────────────────────────────────── */}
      <div className="relative z-40 mx-auto flex w-full max-w-6xl items-end justify-between gap-2 pb-2 sm:pb-6">
        {/* Character label + arrow buttons */}
        <div className="flex flex-col" style={{ maxWidth: 'clamp(180px, 30vw, 340px)' }}>
          <p className="mb-0.5 text-xs font-extrabold uppercase tracking-[0.02em] text-[#0F172A] opacity-95 sm:mb-2 sm:text-[22px]">
            {active.name.toUpperCase()} FIGURINES
          </p>
          <p className="mb-3 hidden text-sm leading-relaxed text-[#334155] opacity-85 sm:mb-5 sm:block">
            {active.description}
          </p>

          <div className="flex items-center gap-2 sm:gap-3">
            {[
              { fn: prev, Icon: ArrowLeft,  label: 'Previous character' },
              { fn: next, Icon: ArrowRight, label: 'Next character'     },
            ].map(({ fn, Icon, label }) => (
              <button
                key={label}
                onClick={fn}
                aria-label={label}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#0F172A] text-[#0F172A] shadow-sm transition-all duration-150 hover:scale-[1.08] hover:bg-[#0F172A]/10 active:scale-95 sm:h-16 sm:w-16"
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
              </button>
            ))}
          </div>
        </div>

        {/* Go home */}
        <a
          href="/"
          onClick={goHome}
          className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap font-black uppercase tracking-tight text-[#0F172A] opacity-95 transition-all duration-200 hover:text-[#1E3A8A] hover:opacity-100 sm:gap-2"
          style={{ fontSize: 'clamp(0.75rem, 3vw, 2.25rem)' }}
        >
          GO HOME
          <ArrowRight strokeWidth={2.25} style={{ width: 'clamp(1rem, 2.5vw, 2rem)', height: 'clamp(1rem, 2.5vw, 2rem)' }} />
        </a>
      </div>
    </div>
  );
}
