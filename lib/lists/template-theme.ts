import {
  DefaultTemplateId,
  EventType,
  KidsBirthdayTemplateId,
  TemplateId,
} from '@/lib/lists/types'

type SurfaceTheme = {
  background: string
  borderColor: string
}

export type ListTemplateTheme = {
  shellBackground: string
  panel: SurfaceTheme
  card: SurfaceTheme
  wheelPalette: string[]
}

const baseTheme = (
  shellBackground: string,
  panel: SurfaceTheme,
  card: SurfaceTheme,
  wheelPalette: string[]
): ListTemplateTheme => ({
  shellBackground,
  panel,
  card,
  wheelPalette,
})

const svgPattern = (svg: string) => {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

const GRAIN_OVERLAY = svgPattern(
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><g fill='rgba(255,255,255,0.06)'><circle cx='8' cy='10' r='0.7'/><circle cx='34' cy='22' r='0.8'/><circle cx='69' cy='14' r='0.7'/><circle cx='108' cy='26' r='0.8'/><circle cx='19' cy='57' r='0.8'/><circle cx='55' cy='46' r='0.7'/><circle cx='86' cy='60' r='0.8'/><circle cx='121' cy='48' r='0.7'/><circle cx='12' cy='97' r='0.8'/><circle cx='42' cy='88' r='0.7'/><circle cx='78' cy='102' r='0.8'/><circle cx='114' cy='94' r='0.7'/><circle cx='22' cy='128' r='0.8'/><circle cx='61' cy='121' r='0.7'/><circle cx='96' cy='132' r='0.8'/><circle cx='129' cy='120' r='0.7'/></g><g fill='rgba(0,0,0,0.05)'><circle cx='25' cy='6' r='0.7'/><circle cx='48' cy='30' r='0.6'/><circle cx='95' cy='20' r='0.7'/><circle cx='129' cy='37' r='0.6'/><circle cx='7' cy='70' r='0.6'/><circle cx='38' cy='64' r='0.7'/><circle cx='73' cy='77' r='0.6'/><circle cx='107' cy='69' r='0.7'/><circle cx='133' cy='82' r='0.6'/><circle cx='30' cy='109' r='0.7'/><circle cx='66' cy='98' r='0.6'/><circle cx='101' cy='112' r='0.7'/><circle cx='10' cy='123' r='0.6'/><circle cx='51' cy='133' r='0.7'/><circle cx='85' cy='126' r='0.6'/><circle cx='117' cy='137' r='0.7'/></g></svg>"
)

const WEDDING_CLASSIC_PATTERN = svgPattern(
  "<svg xmlns='http://www.w3.org/2000/svg' width='168' height='168' viewBox='0 0 168 168'><g fill='none' stroke='rgba(120,95,56,0.24)' stroke-width='0.7'><path d='M0 42h168M0 126h168M42 0v168M126 0v168'/></g><g fill='rgba(120,95,56,0.26)'><circle cx='42' cy='42' r='1.3'/><circle cx='126' cy='42' r='1.3'/><circle cx='42' cy='126' r='1.3'/><circle cx='126' cy='126' r='1.3'/></g></svg>"
)

const WEDDING_MODERN_PATTERN = svgPattern(
  "<svg xmlns='http://www.w3.org/2000/svg' width='176' height='176' viewBox='0 0 176 176'><g fill='none' stroke='rgba(246,236,213,0.2)' stroke-width='0.8'><path d='M88 0L176 88 88 176 0 88Z'/><path d='M44 44L132 44 132 132 44 132Z'/><path d='M88 0V176M0 88H176'/></g></svg>"
)

const WEDDING_MINIMAL_PATTERN = svgPattern(
  "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M0 0.5H28M0.5 0V28' stroke='rgba(134,120,103,0.18)' stroke-width='0.6'/><path d='M14 0V28M0 14H28' stroke='rgba(170,156,136,0.12)' stroke-width='0.5'/></svg>"
)

const WEDDING_PLAYFUL_PATTERN = svgPattern(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><g fill='rgba(173,123,136,0.2)'><circle cx='22' cy='26' r='1.1'/><circle cx='68' cy='20' r='1.2'/><circle cx='114' cy='32' r='1.1'/><circle cx='158' cy='26' r='1.2'/><circle cx='34' cy='76' r='1.1'/><circle cx='84' cy='70' r='1.2'/><circle cx='142' cy='84' r='1.1'/><circle cx='22' cy='126' r='1.1'/><circle cx='70' cy='132' r='1.2'/><circle cx='118' cy='122' r='1.1'/><circle cx='160' cy='136' r='1.2'/></g><path d='M0 94C28 82 54 82 82 94S138 106 180 92' stroke='rgba(255,255,255,0.18)' stroke-width='0.8' fill='none'/></svg>"
)

const WEDDING_TEMPLATE_THEMES: Record<DefaultTemplateId, ListTemplateTheme> = {
  classic: baseTheme(
    `${GRAIN_OVERLAY}, ${WEDDING_CLASSIC_PATTERN}, radial-gradient(circle at 12% 10%, rgba(255,255,255,0.72), transparent 42%), radial-gradient(circle at 84% 8%, rgba(198,167,94,0.22), transparent 40%), radial-gradient(circle at 50% 76%, rgba(222,207,185,0.34), transparent 62%), radial-gradient(circle at 0% 0%, rgba(198,167,94,0.16), transparent 24%), radial-gradient(circle at 100% 100%, rgba(198,167,94,0.14), transparent 26%), linear-gradient(160deg, #F8F5F0 0%, #EFE7DC 100%)`,
    {
      background: `${GRAIN_OVERLAY}, radial-gradient(circle at 0% 0%, rgba(198,167,94,0.16), transparent 32%), radial-gradient(circle at 100% 100%, rgba(198,167,94,0.12), transparent 34%), linear-gradient(145deg, rgba(55, 44, 32, 0.8), rgba(74, 59, 44, 0.72))`,
      borderColor: 'rgba(198, 167, 94, 0.46)',
    },
    {
      background: `${GRAIN_OVERLAY}, linear-gradient(148deg, rgba(43, 33, 24, 0.82), rgba(66, 51, 38, 0.7))`,
      borderColor: 'rgba(198, 167, 94, 0.34)',
    },
    ['#C6A75E', '#D4B978', '#F1E3B3', '#B58F4A', '#D9C8A1', '#A57A3A']
  ),
  modern: baseTheme(
    `${GRAIN_OVERLAY}, ${WEDDING_MODERN_PATTERN}, radial-gradient(circle at 50% 18%, rgba(255,255,255,0.14), transparent 36%), radial-gradient(circle at 50% 44%, rgba(241,225,178,0.18), transparent 52%), radial-gradient(circle at 0% 0%, rgba(212,175,55,0.08), transparent 24%), radial-gradient(circle at 100% 100%, rgba(212,175,55,0.08), transparent 24%), linear-gradient(164deg, #0F2027 0%, #1E3A34 52%, #1C2A39 100%)`,
    {
      background: `${GRAIN_OVERLAY}, radial-gradient(circle at 52% 10%, rgba(212,175,55,0.14), transparent 36%), linear-gradient(150deg, rgba(16, 31, 39, 0.88), rgba(29, 54, 66, 0.74))`,
      borderColor: 'rgba(212, 175, 55, 0.44)',
    },
    {
      background: `${GRAIN_OVERLAY}, linear-gradient(145deg, rgba(12, 24, 32, 0.84), rgba(24, 43, 54, 0.7))`,
      borderColor: 'rgba(233, 214, 171, 0.28)',
    },
    ['#D4AF37', '#E8D8A9', '#F5ECD2', '#B08A2D', '#C89F3D', '#E9C76A']
  ),
  minimal: baseTheme(
    `${GRAIN_OVERLAY}, ${WEDDING_MINIMAL_PATTERN}, radial-gradient(circle at 50% 0%, rgba(255,255,255,0.58), transparent 34%), radial-gradient(circle at 50% 88%, rgba(199,181,160,0.2), transparent 56%), linear-gradient(168deg, #FBF9F6 0%, #F4EEE6 100%)`,
    {
      background: `${GRAIN_OVERLAY}, linear-gradient(152deg, rgba(44, 39, 33, 0.76), rgba(60, 54, 46, 0.68))`,
      borderColor: 'rgba(199, 181, 160, 0.42)',
    },
    {
      background: `${GRAIN_OVERLAY}, linear-gradient(150deg, rgba(39, 34, 29, 0.74), rgba(57, 51, 44, 0.64))`,
      borderColor: 'rgba(199, 181, 160, 0.3)',
    },
    ['#D8C6AE', '#BFA989', '#A69176', '#E8DBC9', '#CDBA9F', '#99836A']
  ),
  playful: baseTheme(
    `${GRAIN_OVERLAY}, ${WEDDING_PLAYFUL_PATTERN}, radial-gradient(circle at 22% 14%, rgba(255,255,255,0.46), transparent 38%), radial-gradient(circle at 76% 8%, rgba(232,199,199,0.34), transparent 42%), radial-gradient(circle at 50% 72%, rgba(252,227,220,0.36), transparent 54%), linear-gradient(160deg, #FDF6F2 0%, #F7E7E2 52%, #F2DFDB 100%)`,
    {
      background: `${GRAIN_OVERLAY}, radial-gradient(circle at 100% 0%, rgba(232,199,199,0.18), transparent 34%), linear-gradient(148deg, rgba(73, 47, 56, 0.74), rgba(99, 67, 80, 0.66))`,
      borderColor: 'rgba(232, 199, 199, 0.44)',
    },
    {
      background: `${GRAIN_OVERLAY}, linear-gradient(150deg, rgba(67, 42, 50, 0.72), rgba(89, 58, 70, 0.62))`,
      borderColor: 'rgba(232, 199, 199, 0.34)',
    },
    ['#E8C7C7', '#D9AFAF', '#F2DADA', '#C99595', '#E6B9B9', '#B57E89']
  ),
}

const BASE_TEMPLATE_THEMES: Record<DefaultTemplateId, ListTemplateTheme> = {
  classic: baseTheme(
    'radial-gradient(circle at 18% 8%, rgba(56, 189, 248, 0.2), transparent 42%), radial-gradient(circle at 82% 2%, rgba(148, 163, 184, 0.18), transparent 36%), linear-gradient(155deg, #020617 0%, #0f172a 56%, #111827 100%)',
    {
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.78))',
      borderColor: 'rgba(148, 163, 184, 0.42)',
    },
    {
      background: 'linear-gradient(148deg, rgba(2, 6, 23, 0.82), rgba(30, 41, 59, 0.7))',
      borderColor: 'rgba(148, 163, 184, 0.3)',
    },
    ['#22d3ee', '#38bdf8', '#60a5fa', '#a78bfa', '#14b8a6', '#10b981']
  ),
  modern: baseTheme(
    'radial-gradient(circle at 16% 10%, rgba(34, 211, 238, 0.24), transparent 40%), radial-gradient(circle at 86% 0%, rgba(59, 130, 246, 0.2), transparent 36%), linear-gradient(160deg, #031525 0%, #0b2a3f 52%, #082f49 100%)',
    {
      background: 'linear-gradient(150deg, rgba(8, 47, 73, 0.84), rgba(12, 74, 110, 0.72))',
      borderColor: 'rgba(34, 211, 238, 0.42)',
    },
    {
      background: 'linear-gradient(145deg, rgba(8, 47, 73, 0.78), rgba(14, 116, 144, 0.62))',
      borderColor: 'rgba(56, 189, 248, 0.34)',
    },
    ['#22d3ee', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#14b8a6']
  ),
  minimal: baseTheme(
    'radial-gradient(circle at 10% 14%, rgba(241, 245, 249, 0.08), transparent 34%), radial-gradient(circle at 90% 4%, rgba(148, 163, 184, 0.14), transparent 30%), linear-gradient(164deg, #0b1120 0%, #111827 58%, #0f172a 100%)',
    {
      background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.66))',
      borderColor: 'rgba(203, 213, 225, 0.32)',
    },
    {
      background: 'linear-gradient(150deg, rgba(15, 23, 42, 0.72), rgba(51, 65, 85, 0.6))',
      borderColor: 'rgba(148, 163, 184, 0.3)',
    },
    ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b']
  ),
  playful: baseTheme(
    'radial-gradient(circle at 22% 8%, rgba(45, 212, 191, 0.24), transparent 42%), radial-gradient(circle at 86% 2%, rgba(251, 113, 133, 0.22), transparent 38%), linear-gradient(160deg, #07283c 0%, #103f55 54%, #5b1d4d 100%)',
    {
      background: 'linear-gradient(145deg, rgba(15, 118, 110, 0.64), rgba(67, 56, 202, 0.6))',
      borderColor: 'rgba(99, 102, 241, 0.4)',
    },
    {
      background: 'linear-gradient(150deg, rgba(13, 148, 136, 0.46), rgba(190, 24, 93, 0.36))',
      borderColor: 'rgba(251, 113, 133, 0.34)',
    },
    ['#34d399', '#2dd4bf', '#22d3ee', '#60a5fa', '#f472b6', '#fb7185']
  ),
}

const KIDS_TEMPLATE_THEMES: Record<KidsBirthdayTemplateId, ListTemplateTheme> = {
  kidsBoyTinyPilot: baseTheme(
    'radial-gradient(circle at 22% 12%, rgba(147, 197, 253, 0.3), transparent 40%), radial-gradient(circle at 84% 4%, rgba(125, 211, 252, 0.28), transparent 36%), linear-gradient(162deg, #0f3a6d 0%, #1d4e89 54%, #2563eb 100%)',
    {
      background: 'linear-gradient(150deg, rgba(37, 99, 235, 0.68), rgba(56, 189, 248, 0.58))',
      borderColor: 'rgba(125, 211, 252, 0.5)',
    },
    {
      background: 'linear-gradient(145deg, rgba(29, 78, 137, 0.68), rgba(56, 189, 248, 0.44))',
      borderColor: 'rgba(147, 197, 253, 0.42)',
    },
    ['#60a5fa', '#38bdf8', '#22d3ee', '#93c5fd', '#34d399', '#facc15']
  ),
  kidsBoyDinoRanger: baseTheme(
    'radial-gradient(circle at 16% 12%, rgba(163, 230, 53, 0.26), transparent 38%), radial-gradient(circle at 84% 4%, rgba(74, 222, 128, 0.24), transparent 34%), linear-gradient(160deg, #163020 0%, #14532d 52%, #0f766e 100%)',
    {
      background: 'linear-gradient(146deg, rgba(22, 101, 52, 0.7), rgba(21, 128, 61, 0.56))',
      borderColor: 'rgba(134, 239, 172, 0.42)',
    },
    {
      background: 'linear-gradient(145deg, rgba(20, 83, 45, 0.72), rgba(13, 148, 136, 0.42))',
      borderColor: 'rgba(110, 231, 183, 0.36)',
    },
    ['#84cc16', '#22c55e', '#10b981', '#2dd4bf', '#facc15', '#f97316']
  ),
  kidsBoyGalaxyRacer: baseTheme(
    'radial-gradient(circle at 16% 8%, rgba(129, 140, 248, 0.3), transparent 38%), radial-gradient(circle at 88% 0%, rgba(59, 130, 246, 0.26), transparent 34%), linear-gradient(158deg, #1e1b4b 0%, #312e81 54%, #1d4ed8 100%)',
    {
      background: 'linear-gradient(146deg, rgba(49, 46, 129, 0.72), rgba(59, 130, 246, 0.58))',
      borderColor: 'rgba(129, 140, 248, 0.46)',
    },
    {
      background: 'linear-gradient(144deg, rgba(30, 58, 138, 0.72), rgba(99, 102, 241, 0.48))',
      borderColor: 'rgba(96, 165, 250, 0.36)',
    },
    ['#6366f1', '#3b82f6', '#06b6d4', '#22d3ee', '#f59e0b', '#f97316']
  ),
  kidsGirlTinyBloom: baseTheme(
    'radial-gradient(circle at 18% 10%, rgba(251, 146, 60, 0.2), transparent 34%), radial-gradient(circle at 84% 2%, rgba(251, 113, 133, 0.3), transparent 34%), linear-gradient(160deg, #7c2d12 0%, #9a3412 52%, #be185d 100%)',
    {
      background: 'linear-gradient(146deg, rgba(194, 65, 12, 0.64), rgba(225, 29, 72, 0.56))',
      borderColor: 'rgba(253, 164, 175, 0.46)',
    },
    {
      background: 'linear-gradient(145deg, rgba(154, 52, 18, 0.66), rgba(236, 72, 153, 0.42))',
      borderColor: 'rgba(251, 146, 60, 0.36)',
    },
    ['#fb7185', '#f97316', '#fb923c', '#f9a8d4', '#c084fc', '#a78bfa']
  ),
  kidsGirlFairyGarden: baseTheme(
    'radial-gradient(circle at 18% 10%, rgba(134, 239, 172, 0.24), transparent 36%), radial-gradient(circle at 84% 2%, rgba(196, 181, 253, 0.28), transparent 34%), linear-gradient(160deg, #14532d 0%, #0f766e 52%, #6d28d9 100%)',
    {
      background: 'linear-gradient(146deg, rgba(21, 128, 61, 0.62), rgba(126, 34, 206, 0.52))',
      borderColor: 'rgba(196, 181, 253, 0.44)',
    },
    {
      background: 'linear-gradient(145deg, rgba(15, 118, 110, 0.64), rgba(168, 85, 247, 0.44))',
      borderColor: 'rgba(167, 243, 208, 0.36)',
    },
    ['#34d399', '#2dd4bf', '#a78bfa', '#c084fc', '#f472b6', '#fb7185']
  ),
  kidsGirlStarlightPop: baseTheme(
    'radial-gradient(circle at 16% 8%, rgba(244, 114, 182, 0.3), transparent 36%), radial-gradient(circle at 86% 2%, rgba(192, 132, 252, 0.28), transparent 34%), linear-gradient(160deg, #581c87 0%, #be185d 52%, #7c3aed 100%)',
    {
      background: 'linear-gradient(148deg, rgba(190, 24, 93, 0.68), rgba(124, 58, 237, 0.54))',
      borderColor: 'rgba(244, 114, 182, 0.46)',
    },
    {
      background: 'linear-gradient(146deg, rgba(136, 19, 55, 0.7), rgba(147, 51, 234, 0.48))',
      borderColor: 'rgba(196, 181, 253, 0.36)',
    },
    ['#f472b6', '#ec4899', '#c084fc', '#a78bfa', '#22d3ee', '#f59e0b']
  ),
}

const resolveNonKidsTheme = (templateId: TemplateId) => {
  if (templateId in BASE_TEMPLATE_THEMES) {
    return BASE_TEMPLATE_THEMES[templateId as DefaultTemplateId]
  }

  return BASE_TEMPLATE_THEMES.classic
}

const resolveKidsTheme = (templateId: TemplateId) => {
  if (templateId in KIDS_TEMPLATE_THEMES) {
    return KIDS_TEMPLATE_THEMES[templateId as KidsBirthdayTemplateId]
  }

  if (templateId in BASE_TEMPLATE_THEMES) {
    return BASE_TEMPLATE_THEMES[templateId as DefaultTemplateId]
  }

  return KIDS_TEMPLATE_THEMES.kidsBoyTinyPilot
}

export const getListTemplateTheme = (
  eventType: EventType,
  templateId: TemplateId
): ListTemplateTheme => {
  if (eventType === 'kidsBirthday') {
    return resolveKidsTheme(templateId)
  }

  if (eventType === 'wedding' && templateId in WEDDING_TEMPLATE_THEMES) {
    return WEDDING_TEMPLATE_THEMES[templateId as DefaultTemplateId]
  }

  return resolveNonKidsTheme(templateId)
}
