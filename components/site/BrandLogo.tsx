import Link from 'next/link'
import { useId } from 'react'

type BrandTone = 'header' | 'event' | 'light'
type BrandSize = 'sm' | 'md' | 'lg'

type BrandLogoProps = {
  href?: string
  tone?: BrandTone
  size?: BrandSize
  animated?: boolean
  showTagline?: boolean
  className?: string
  wordmarkClassName?: string
}

const TONE_STYLES: Record<BrandTone, {
  shell: string
  panel: string
  primary: string
  secondary: string
  ring: string
  spark: string
  ink: string
  studio: string
}> = {
  header: {
    shell: '#083344',
    panel: '#0f766e',
    primary: '#72f5d1',
    secondary: '#06b6d4',
    ring: 'rgba(216, 254, 255, 0.34)',
    spark: 'rgba(114, 245, 209, 0.82)',
    ink: '#f8fafc',
    studio: '#99f6e4',
  },
  event: {
    shell: 'rgba(7, 18, 31, 0.52)',
    panel: 'rgba(255, 255, 255, 0.12)',
    primary: 'var(--event-accent)',
    secondary: 'var(--event-link)',
    ring: 'var(--event-border-card)',
    spark: 'rgba(255, 255, 255, 0.44)',
    ink: 'var(--event-text-strong)',
    studio: 'var(--event-link)',
  },
  light: {
    shell: '#5b4420',
    panel: '#b68a37',
    primary: '#f4d584',
    secondary: '#d3a44b',
    ring: 'rgba(120, 87, 34, 0.28)',
    spark: 'rgba(244, 213, 132, 0.78)',
    ink: '#2f2215',
    studio: '#8f6c34',
  },
}

const SIZE_STYLES: Record<BrandSize, {
  mark: string
  text: string
  studio: string
}> = {
  sm: {
    mark: 'h-9 w-9',
    text: 'text-[0.98rem]',
    studio: 'text-[0.72rem]',
  },
  md: {
    mark: 'h-10 w-10',
    text: 'text-[1.05rem]',
    studio: 'text-[0.76rem]',
  },
  lg: {
    mark: 'h-12 w-12',
    text: 'text-[1.18rem]',
    studio: 'text-[0.82rem]',
  },
}

function BrandContent({
  tone,
  size,
  animated,
  showTagline,
  wordmarkClassName,
}: Pick<BrandLogoProps, 'tone' | 'size' | 'animated' | 'showTagline' | 'wordmarkClassName'>) {
  const palette = TONE_STYLES[tone ?? 'header']
  const dimensions = SIZE_STYLES[size ?? 'md']
  const markId = useId().replace(/:/g, '')
  const haloId = `${markId}-halo`
  const glowId = `${markId}-glow`
  const lidId = `${markId}-lid`
  const boxId = `${markId}-box`
  const ribbonId = `${markId}-ribbon`
  const leftBowId = `${markId}-left-bow`
  const rightBowId = `${markId}-right-bow`
  const sheenId = `${markId}-sheen`
  const shadowId = `${markId}-shadow`

  return (
    <>
      <span className={`${dimensions.mark} relative inline-flex shrink-0 items-center justify-center`}>
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className={`brand-mark ${animated ? 'brand-mark--animated' : ''} h-full w-full`}
        >
          <defs>
            <filter id={haloId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4.8" />
            </filter>
            <linearGradient id={lidId} x1="13" y1="21" x2="53" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.secondary} />
              <stop offset="0.52" stopColor={palette.panel} />
              <stop offset="1" stopColor={palette.primary} />
            </linearGradient>
            <linearGradient id={boxId} x1="13" y1="28" x2="51" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.secondary} />
              <stop offset="0.45" stopColor={palette.panel} />
              <stop offset="1" stopColor={palette.shell} />
            </linearGradient>
            <linearGradient id={ribbonId} x1="27" y1="22" x2="37" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.spark} />
              <stop offset="0.42" stopColor={palette.primary} />
              <stop offset="1" stopColor={palette.secondary} />
            </linearGradient>
            <linearGradient id={leftBowId} x1="13" y1="12" x2="31" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.secondary} />
              <stop offset="1" stopColor={palette.shell} />
            </linearGradient>
            <linearGradient id={rightBowId} x1="33" y1="12" x2="51" y2="26" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.primary} />
              <stop offset="1" stopColor={palette.shell} />
            </linearGradient>
            <linearGradient id={sheenId} x1="31" y1="23" x2="43" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.88)" />
              <stop offset="0.32" stopColor="rgba(255,255,255,0.34)" />
              <stop offset="1" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id={shadowId} x1="12" y1="28" x2="32" y2="55" gradientUnits="userSpaceOnUse">
              <stop stopColor={palette.shell} stopOpacity="0.08" />
              <stop offset="1" stopColor={palette.shell} stopOpacity="0.44" />
            </linearGradient>
            <radialGradient id={glowId} cx="50%" cy="44%" r="54%">
              <stop offset="0" stopColor={palette.spark} stopOpacity="0.85" />
              <stop offset="0.42" stopColor={palette.primary} stopOpacity="0.38" />
              <stop offset="1" stopColor={palette.primary} stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse
            className="brand-mark__spark"
            cx="32"
            cy="31"
            rx="18"
            ry="16"
            fill={`url(#${glowId})`}
            filter={`url(#${haloId})`}
          />

          <g className="brand-mark__frame">
            <path
              d="M31 20.5C25.6 23.8 19.7 24.4 14.2 21.8C14.2 14.8 20.8 11.3 26.9 13.2C29.5 14 30.6 16.7 31 20.5Z"
              fill={`url(#${leftBowId})`}
              stroke={palette.shell}
              strokeOpacity="0.48"
              strokeWidth="1.4"
            />
            <path
              d="M33 20.5C38.4 23.8 44.3 24.4 49.8 21.8C49.8 14.8 43.2 11.3 37.1 13.2C34.5 14 33.4 16.7 33 20.5Z"
              fill={`url(#${rightBowId})`}
              stroke={palette.shell}
              strokeOpacity="0.48"
              strokeWidth="1.4"
            />
            <rect
              x="27.2"
              y="18.4"
              width="9.6"
              height="9"
              rx="3.8"
              fill={`url(#${ribbonId})`}
              stroke={palette.ring}
              strokeWidth="1"
            />

            <rect
              x="11"
              y="23.2"
              width="42"
              height="10.4"
              rx="4.8"
              fill={`url(#${lidId})`}
              stroke={palette.ring}
              strokeWidth="1.3"
            />
            <path
              d="M12.2 29.4H51.8"
              fill="none"
              stroke={palette.shell}
              strokeOpacity="0.3"
              strokeWidth="1.4"
            />

            <rect
              x="13"
              y="29.8"
              width="38"
              height="24.2"
              rx="7.4"
              fill={`url(#${boxId})`}
              stroke={palette.ring}
              strokeWidth="1.3"
            />
            <path
              d="M31.7 30.2H18.4C15.4 30.2 13 32.6 13 35.6V46.6C13 50.7 16.3 54 20.4 54H31.7V30.2Z"
              fill={`url(#${shadowId})`}
            />

            <rect
              className="brand-mark__ribbon"
              x="29.1"
              y="22.8"
              width="5.8"
              height="31.2"
              rx="2.9"
              fill={`url(#${ribbonId})`}
            />
            <path
              d="M35 23H37.8L32.7 54H31.2Z"
              fill={`url(#${sheenId})`}
              opacity="0.9"
            />
            <path
              d="M11 23.3H53"
              fill="none"
              stroke={palette.spark}
              strokeOpacity="0.18"
              strokeWidth="1.1"
            />
          </g>
        </svg>
      </span>

      <span className={`min-w-0 leading-none ${wordmarkClassName ?? ''}`}>
        <span
          className={`block truncate font-semibold tracking-[-0.04em] ${dimensions.text}`}
          style={{ color: palette.ink }}
        >
          Giftlist <span style={{ color: palette.studio }}>Studio</span>
        </span>
        {showTagline && (
          <span
            className={`mt-1 block truncate font-medium uppercase tracking-[0.22em] ${dimensions.studio}`}
            style={{ color: palette.studio }}
          >
            Share gifts beautifully
          </span>
        )}
      </span>
    </>
  )
}

export default function BrandLogo({
  href,
  tone = 'header',
  size = 'md',
  animated = false,
  showTagline = false,
  className = '',
  wordmarkClassName = '',
}: BrandLogoProps) {
  const content = (
    <span className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
      <BrandContent
        tone={tone}
        size={size}
        animated={animated}
        showTagline={showTagline}
        wordmarkClassName={wordmarkClassName}
      />
    </span>
  )

  if (!href) {
    return content
  }

  return (
    <Link href={href} className={`inline-flex min-w-0 items-center ${className}`}>
      <BrandContent
        tone={tone}
        size={size}
        animated={animated}
        showTagline={showTagline}
        wordmarkClassName={wordmarkClassName}
      />
    </Link>
  )
}
