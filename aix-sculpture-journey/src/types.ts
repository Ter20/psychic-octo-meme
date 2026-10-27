export interface Chapter {
  id: number;
  roman: string;
  title: string;
  subtitle: string;
  desc: string;
  tags: string[];
  metric?: string;
  actionType?: 'phone' | 'consult' | 'explore';
  ctaText?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    roman: "I",
    title: "THE MIRROR OF INTENT",
    subtitle: "EDUCE Thought Engineering",
    desc: "Prompt engineering is thought engineering. AI does not replace your brain—it acts as a clear mirror reflecting the depth of your independent thinking and intent.",
    tags: ["Cognitive Framing", "Thought Architecture", "Executive Clarity"],
    metric: "10x Cognitive Leverage",
  },
  {
    id: 2,
    roman: "II",
    title: "THE SPEED OF RESPONSE",
    subtitle: "V.I.R.A. Revenue Accelerator",
    desc: "While traditional businesses take 47 hours to follow up on a lead, V.I.R.A. responds in under 60 seconds 24/7 to qualify leads and book appointments automatically.",
    tags: ["Sub-60s Inbound", "Voice AI", "Autonomous Qualifying"],
    metric: "< 60s Average Response",
    actionType: "phone",
  },
  {
    id: 3,
    roman: "III",
    title: "SYSTEMS MASTERY",
    subtitle: "AIX Dallas Intelligence",
    desc: "Empowering Dallas-area marketers, real estate agencies, and consultants with granular business intelligence, composability ratings, and clear data sourcing.",
    tags: ["Data Pipeline", "Local Market Intelligence", "Custom RAG"],
    metric: "99.4% Extraction Precision",
  },
  {
    id: 4,
    roman: "IV",
    title: "THE INTEGRATION INVITATION",
    subtitle: "Transform Your Business Today",
    desc: "Join Artificial Intelligence Xtreme (AIX). Save time, eliminate missed calls, and scale your local revenue with automated voice and intelligent systems.",
    tags: ["White-Glove Deployment", "Revenue Operations", "Full System Setup"],
    metric: "Turnkey Implementation",
    actionType: "consult",
  },
];
