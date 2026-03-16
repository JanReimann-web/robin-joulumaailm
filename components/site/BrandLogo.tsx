import Link from 'next/link'

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
    shell: '#0f172a',
    panel: '#1e293b',
    primary: '#34d399',
    secondary: '#7dd3fc',
    ring: 'rgba(255,255,255,0.18)',
    spark: '#fde68a',
    ink: '#f8fafc',
    studio: '#99f6e4',
  },
  event: {
    shell: 'var(--event-surface-card)',
    panel: 'rgba(255,255,255,0.06)',
    primary: 'var(--event-accent)',
    secondary: 'var(--event-link)',
    ring: 'var(--event-border-card)',
    spark: 'var(--event-accent)',
    ink: 'var(--event-text-strong)',
    studio: 'var(--event-link)',
  },
  light: {
    shell: '#fffaf0',
    panel: '#f1e7d5',
    primary: '#c6a75e',
    secondary: '#9b7d3c',
    ring: 'rgba(155,125,60,0.2)',
    spark: '#d9b457',
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

  return (
    <>
      <span className={`${dimensions.mark} relative inline-flex shrink-0 items-center justify-center`}>
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className={`brand-mark ${animated ? 'brand-mark--animated' : ''} h-full w-full`}
        >
          <rect
            className="brand-mark__frame"
            x="5"
            y="7"
            width="54"
            height="50"
            rx="16"
            fill={palette.shell}
            stroke={palette.ring}
            strokeWidth="2"
          />
          <rect
            x="10"
            y="19"
            width="44"
            height="10"
            rx="5"
            fill={palette.secondary}
            opacity="0.94"
          />
          <path
            d="M31.5 21.5C23.6 13.3 18.8 12.8 15.1 17.4C19.1 23 24.6 24 31.5 21.5Z"
            fill={palette.secondary}
          />
          <path
            d="M32.5 21.5C40.4 13.3 45.2 12.8 48.9 17.4C44.9 23 39.4 24 32.5 21.5Z"
            fill={palette.primary}
          />
          <rect
            className="brand-mark__ribbon"
            x="29"
            y="19"
            width="6"
            height="33"
            rx="3"
            fill={palette.primary}
          />
          <rect
            x="13"
            y="28"
            width="38"
            height="22"
            rx="10"
            fill={palette.panel}
          />
          <path
            d="M22 40.5L28 46.5L42.5 32"
            fill="none"
            stroke={palette.ink}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            className="brand-mark__spark"
            d="M51.5 11.5L53.1 15.4L57 17L53.1 18.6L51.5 22.5L49.9 18.6L46 17L49.9 15.4Z"
            fill={palette.spark}
          />
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
