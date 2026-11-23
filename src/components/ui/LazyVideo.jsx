import { useEffect, useRef, useState } from 'react'

const REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * <video> whose `src` is only attached once it comes within `rootMargin` of
 * the viewport, so a page full of clips does not download them all at once.
 * Background loops (no `controls`) also pause while scrolled out of view and
 * stay on their poster when the visitor prefers reduced motion.
 * `persistent` loops never pause: they load early and are resumed if the
 * browser stops them, for clips that are transformed by scroll effects.
 * `load` attaches the source straight away, for clips a parent knows are about
 * to be shown but that the viewport check cannot see (e.g. clipped in a rail).
 */
export default function LazyVideo({ src, poster, controls = false, persistent = false, load = false, rootMargin = persistent ? '1200px' : '400px', style, className, title, ...rest }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  const active = near || load
  const autoplay = !controls && !REDUCED_MOTION

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const loader = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          loader.disconnect()
        }
      },
      { rootMargin },
    )
    loader.observe(el)
    return () => loader.disconnect()
  }, [rootMargin])

  useEffect(() => {
    const el = ref.current
    if (!el || !active || !autoplay) return undefined
    // Persistent loops always count as on screen; the rest follow the viewport.
    let onScreen = persistent
    // A play() can be refused or dropped (still buffering, tab in the background,
    // the browser pausing it), so it is retried whenever the clip could run.
    const resume = () => {
      if (onScreen && el.paused && !document.hidden) el.play().catch(() => {})
    }
    const events = ['pause', 'canplay', 'loadeddata']
    events.forEach((name) => el.addEventListener(name, resume))
    document.addEventListener('visibilitychange', resume)
    let player
    if (persistent) {
      resume()
    } else {
      player = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting
        if (onScreen) resume()
        else el.pause()
      })
      player.observe(el)
    }
    return () => {
      player?.disconnect()
      events.forEach((name) => el.removeEventListener(name, resume))
      document.removeEventListener('visibilitychange', resume)
    }
  }, [active, autoplay, persistent])

  return (
    <video
      ref={ref}
      src={active ? src : undefined}
      poster={poster}
      muted={!controls}
      loop={!controls}
      playsInline
      autoPlay={autoplay}
      preload={active ? (controls ? 'metadata' : 'auto') : 'none'}
      controls={controls}
      controlsList={controls ? 'nodownload' : undefined}
      disablePictureInPicture={!controls}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      tabIndex={controls ? undefined : -1}
      className={className}
      style={style}
      {...rest}
    />
  )
}
