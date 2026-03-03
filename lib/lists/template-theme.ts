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

  return resolveNonKidsTheme(templateId)
}
