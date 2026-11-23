import { useEffect, useRef } from 'react'
import useIsMobile from '../../lib/useIsMobile'
import LazyVideo from '../ui/LazyVideo'
import FullFrameMedia from '../ui/FullFrameMedia'
import { posterSrc, videoSrc } from '../../lib/media'
/** Full-bleed clip that plays behind the manifesto line. */
const BG_VIDEO = 'fashion'

/** Manifesto copy, one entry per line (line breaks only apply from md up). */
const LINES = ['An AI studio built for the GenAI era,', 'reimagining how visionary artists create films,', 'series, and new forms of storytelling.']
const WORDS = LINES.flatMap((line, li) => line.split(' ').map((word) => ({ word, line: li })))

const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const range = (start, end, v) => clamp01((v - start) / (end - start))

/**
 * Sticky manifesto line over a full-bleed clip. Progress is read straight from
 * scroll position and drives the word-by-word reveal and the clip's slow zoom.
 */
export default function ManifestoSection() {
  const sectionRef = useRef(null)
  const stickyRef = useRef(null)
  const bgRef = useRef(null)
  const wordRefs = useRef([])
  const isMobile = useIsMobile()

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current
      const sticky = stickyRef.current
      const bg = bgRef.current
      if (!section || !sticky || !bg) return
      // The sticky frame's height (100vh) stays fixed while a phone's address bar
      // shows and hides, unlike window.innerHeight, so progress never jumps mid-scroll.
      const vh = sticky.offsetHeight
      const rect = section.getBoundingClientRect()
      // Nothing to animate while the section is off screen.
      if (rect.bottom < -vh || rect.top > vh * 2) return
      const progress = clamp01(-rect.top / (section.offsetHeight - vh))
      const small = window.innerWidth < 768

      // Words brighten one after another as the section scrolls through.
      const n = wordRefs.current.length
      wordRefs.current.forEach((el, i) => {
        if (!el) return
        const start = 0.05 + (i / n) * 0.5
        const t = range(start, start + 0.1, progress)
        el.style.opacity = String(lerp(0.14, 1, t))
        el.style.transform = `translateY(${lerp(10, 0, t)}px)`
      })

      // The clip settles from a slow zoom. Phones skip it so the whole uncropped frame stays in view.
      bg.style.transform = `scale(${small ? 1 : lerp(1.12, 1, range(0, 0.8, progress))})`
    }
    // Coalesce scroll events into one update per frame.
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <section ref={sectionRef} style={{ backgroundColor: '#080808', height: isMobile ? '180vh' : '220vh', position: 'relative' }}>
      <div ref={stickyRef} style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* Background video, the same treatment as the homepage hero. */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundColor: '#080808', overflow: 'hidden' }}>
          <div ref={bgRef} style={{ position: 'absolute', inset: 0, transform: 'scale(1.12)', willChange: 'transform' }}>
            {isMobile ? (
              // Phones: the whole, uncropped 16:9 frame inside an ambient fill.
              <FullFrameMedia poster={posterSrc(BG_VIDEO, 'hero')}>
                <LazyVideo
                  persistent
                  src={videoSrc(BG_VIDEO, '720')}
                  poster={posterSrc(BG_VIDEO, 'hero')}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 }}
                />
              </FullFrameMedia>
            ) : (
              <LazyVideo
                persistent
                src={videoSrc(BG_VIDEO, '1080')}
                poster={posterSrc(BG_VIDEO, 'hero')}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
            )}
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,8,8,0.45) 0%, rgba(8,8,8,0.35) 50%, rgba(8,8,8,0.6) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(8,8,8,0.35) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '180px', background: 'linear-gradient(to bottom, transparent, #080808)' }} />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(64px, 9vh, 96px) clamp(32px, 6vw, 96px) clamp(24px, 4vh, 48px)',
          }}
        >
          <p
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: isMobile ? 'clamp(22px, 5.5vw, 63px)' : 'clamp(18px, 3.4vw, 54px)',
              color: '#F2E4C2',
              lineHeight: 1.4,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              textAlign: 'center',
              whiteSpace: 'normal',
              textShadow: '0 2px 24px rgba(8,8,8,0.35)',
            }}
          >
            {WORDS.map((w, i) => (
              <span key={i}>
                {i > 0 && WORDS[i - 1].line !== w.line && <br className="hidden md:block" />}
                <span ref={(el) => (wordRefs.current[i] = el)} style={{ display: 'inline-block', opacity: 0.14, willChange: 'opacity, transform' }}>
                  {w.word}
                </span>{' '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  )
}
