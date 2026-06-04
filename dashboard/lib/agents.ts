export interface AgentConfig {
  id: string
  name: string
  tagline: string
  color: string
  gradientFrom: string
  gradientTo: string
  icon: 'sparkles' | 'grip' | 'zap' | 'shield' | 'flame'
  envKey: string | null // null = built-in Claude CLI bridge
  type?: 'openclaw' | 'generic'
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'claude',
    name: 'Claude',
    tagline: 'Anthropic · AI Assistant',
    color: '#a78bfa',
    gradientFrom: '#7c3aed',
    gradientTo: '#4f46e5',
    icon: 'sparkles',
    envKey: null,
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'Autonomous reasoning & tools',
    color: '#fb923c',
    gradientFrom: '#ea580c',
    gradientTo: '#c2410c',
    icon: 'grip',
    envKey: null,
    type: 'openclaw',
  },
  {
    id: 'hermes',
    name: 'Hermes',
    tagline: 'Fast message routing',
    color: '#60a5fa',
    gradientFrom: '#2563eb',
    gradientTo: '#1d4ed8',
    icon: 'zap',
    envKey: 'HERMES_URL',
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    tagline: 'Security monitoring',
    color: '#34d399',
    gradientFrom: '#059669',
    gradientTo: '#047857',
    icon: 'shield',
    envKey: 'SENTINEL_URL',
  },
  {
    id: 'forge',
    name: 'Forge',
    tagline: 'Code generation',
    color: '#fbbf24',
    gradientFrom: '#d97706',
    gradientTo: '#b45309',
    icon: 'flame',
    envKey: 'FORGE_URL',
  },
]

export function getAgent(id: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === id)
}
