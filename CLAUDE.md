# AIX — Artificial Intelligence Extreme

**Founder:** Terry White · Dallas, TX  
**GitHub repo:** `Ter20/psychic-octo-meme` (branch: `claude/new-session-qnuDX`, PR #3)  
**GitHub Pages (pending):** Enable in repo Settings → Pages → deploy from main/root

---

## What AIX Is

AIX is a local AI marketing and automation agency serving small businesses in the Dallas–Fort Worth area. Terry runs it solo with VIRA as his 24/7 AI voice agent. Services are sold as monthly retainers to local DFW businesses — plumbers, HVAC techs, salons, auto shops, electricians.

**Core value prop:** AI that works while you sleep. Map pack ranking, voice AI, reputation rescue, content creation, and lead recovery — automated and affordable.

---

## VIRA — The AI Voice Agent

- **Phone:** (724) 542-2946
- **Platform:** VAPI
- **Hours:** 24/7, no days off
- **Magic word:** Say **"Terrence"** on any call → Terry's personal phone rings immediately
- **Capability:** Handles AI-to-AI calls (Google's "Have AI Get Prices" feature calls VIRA and she responds correctly)
- **Campaign:** #DareVIRA — dare people to call VIRA and try to confuse her

VIRA is AIX's most powerful sales tool. Always reference her in content, pitches, and copy.

---

## Current Campaign: Google "Have AI Get Prices"

Google's AI calls top 4 local map listings on behalf of customers to get pricing/availability. Key stats for pitching:
- Only top 4 map listings get called
- 5 of 9 businesses tested missed the AI call
- Missed = flagged "unreachable," lead goes to competitor

AIX solution: map pack optimization (get into top 4) + VIRA answers the call 24/7.

Target verticals: plumbing, HVAC, electrical, salons, auto repair.

---

## Pricing Packages

| Package | Price/mo | Focus |
|---------|----------|-------|
| Starter | $850 | Map ranking + missed-call text-back |
| Growth  | $1,200 | Starter + content creation + reputation |
| Pro     | $1,500 | Full AIX flywheel + VIRA integration |

All packages are monthly retainers. Target clients: small local DFW businesses.

---

## Repo Structure

```
/
├── index.html              # AIX landing page (dark luxury, single-page)
├── vira-demo.html          # Interactive VIRA live demo widget (2 scenarios)
├── aix-sculpture-journey/  # 3D brand experience app (React + Three.js)
│   ├── src/
│   │   ├── App.tsx         # GSAP ScrollTrigger camera rig, 4 chapters
│   │   ├── components/
│   │   │   ├── Sculptures.tsx      # All 3D sculpture components (R3F)
│   │   │   ├── OverlayUI.tsx       # HTML overlay UI
│   │   │   └── ConsultationModal.tsx
│   │   └── utils/audio.ts
│   ├── package.json        # Vite + React + Three.js + GSAP
│   └── vite.config.ts
└── CLAUDE.md               # This file
```

---

## Design System

All pages use the AIX dark luxury identity:

```css
--bg:     #050508   /* near-black */
--bg2:    #0c0c12
--bronze: #cd7f32   /* AIX gold/bronze — primary accent */
--blue:   #1d4ed8   /* secondary accent */
--white:  #ffffff
--muted:  #8b8b9a
```

**Fonts:** Cinzel (display/headlines) · Plus Jakarta Sans (body) · Space Mono (mono/data)  
**Feel:** Dark luxury, cinematic, premium but approachable. Never generic SaaS blue.

---

## Landing Page (`index.html`)

Single-page dark luxury site. Sections:
- Fixed nav (links: Services, Dare VIRA, Pricing, Live Demo, About) + "Call VIRA" CTA
- Hero: "AI That Works While You Sleep" + #DareVIRA CTA + "Try the Live Demo" button
- Services grid (4 cards: Voice AI, Content, Reputation, SEO)
- #DareVIRA section with VIRA's phone number
- Pricing cards (Starter $850 / Growth $1,200 / Pro $1,500)
- About/VIRA stats section
- Footer with links to 3D experience

---

## VIRA Demo Widget (`vira-demo.html`)

Interactive chat simulation. Two scenarios:
- **Scenario A:** 48-hour lead recovery flow (after-hours inquiry → lead captured)
- **Scenario B:** "Live Agent" keyword handoff → human takes over with a popup

Special keywords in the demo:
- `Live Agent` → triggers yellow system alert + human handoff card
- `Terrence` → triggers green system alert + founder escalation message

---

## AIX Sculpture Journey (`aix-sculpture-journey/`)

A cinematic 3D brand experience. Built with React + Three.js + React Three Fiber + GSAP ScrollTrigger.

4 chapters (scroll-driven camera journey):
1. **Mirror of Intent** — bust sculpture (z: 0)
2. **Speed of Response** — VIRA falcon sculpture (z: -10)
3. **Systems Mastery** — Dallas business intelligence sculpture (z: -20)
4. **Integration Invitation** — AIX radiant mark sculpture (z: -30)

**Build:** `bun install && bun run dev` (Vite + TypeScript)  
**Mouse parallax:** subtle organic camera breathing on all chapters  
**Inspect mode:** OrbitControls toggle for free camera  
**Modal:** Consultation + blueprint download  

---

## Living Documents (Claude Docs — not in repo)

These are maintained as Claude Docs artifacts. Re-read before updating:

| Document | URL |
|----------|-----|
| AIX Service Packages & Pricing | https://claude.ai/code/artifact/589ec311-b429-4bd2-abae-a929da135ff0 |
| AIX Marketing Content Pack | https://claude.ai/code/artifact/f21ad12c-b581-4065-9390-f4ff71fc49f5 |
| AIX Daily Operating Schedule | https://claude.ai/code/artifact/e569001a-3841-4dab-8586-511805f5ac95 |

---

## Automation Stack (from workflow plan — not yet built out)

- **Make.com** — automation hub
- **Outscraper + Apollo.io** — lead generation
- **Instantly.ai** — cold email sequences
- **HubSpot CRM** — lead management
- **Stripe** — payment processing (Terry needs to set up at stripe.com)

---

## Social / Content

Active platforms: Facebook, Instagram, TikTok, Reddit  
Current campaign hashtag: **#DareVIRA**  
Content style: urgent, specific, proof-based. Lead with Google news or VIRA stats. End every post with the phone number and/or #DareVIRA.

Terry uses **Google Vids** for AI avatar video creation.  
Note: Google Vids may block phone number CTAs — use HTML motion graphics (see the animated artifact) instead and screen-record.

---

## Key Facts for Any Prompt

- Terry is the founder. He runs AIX solo. VIRA handles phones 24/7.
- Target clients are small DFW local service businesses (not enterprise).
- Organic content only — no paid ads yet.
- Pricing is monthly retainers, $850–$1,500.
- The "Say Terrence" feature is AIX's most compelling demo hook.
- GitHub Pages needs to be enabled (Terry does this in repo Settings → Pages).
- Stripe account needs to be set up (Terry does this at stripe.com).
- Make.com automations not yet built.
