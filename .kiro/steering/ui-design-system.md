# Pun — UI Design System

This is the canonical design system for Pun. Every agent, every task, every code change MUST follow these rules exactly. Do not deviate from this system under any circumstances.

---

## Design Foundation

Pun's visual design is built directly on **Kiro's design system** ([kiro.dev](https://kiro.dev)). The `globals.css` was seeded from Kiro's starter template. The following are all Kiro design primitives that Pun inherits:

- CSS variable naming convention: `--brand`, `--brand-hover`, `--brand-light`, `--brand-dim`, `--brand-glow`, `--surface-1/2/3`
- Brand color `#7c3aed` (Kiro purple)
- Font pairing: Plus Jakarta Sans (body) + Geist Mono (terminal labels)
- `border-radius: 12px` card system
- Pill badge pattern (`border-radius: 9999px`)
- Backdrop-blur nav (`blur(12px)`)
- Entrance animations via `motion/react` with `fade-in` and staggered delays

Pun extends this with a **terminal data layer**: `.font-terminal` mono labels, `.panel-bracket` left-accent bars, dense information grids, and `panel-strong` purple glow for highlighted cards.

**Kiro's design system is the base. Pun's terminal/DeFi layer is the extension.**

---

## Core Aesthetic

**Dark terminal dashboard with soft modern edges.** Dense, information-first layout with a purple brand accent and rounded-12 card system.

- `border-radius: 12px` on all panels, cards, inputs, buttons, and modals
- `border-radius: 9999px` (pill) on nav status pills, wallet address badge, and Connect Wallet button
- `border-radius: 0` only on the scroll-to-bottom button (`.rounded-none`)
- Subtle backdrop blur on the TopNav (`blur(12px)`)
- No gradients
- No box shadows except the brand glow on highlighted panels

---

## Color Palette

These are the ONLY colors used in this codebase. Do not introduce new colors.

| Purpose | Value |
|---|---|
| Page background | `#000000` |
| Surface 1 | `#0a0a0a` |
| Panel background | `#111111` |
| Panel hover | `#161616` |
| Panel active / selected | `#1a1a1a` |
| Primary text | `#ffffff` / `#f0f0f0` |
| Secondary text | `#a0a0a0` |
| Muted / disabled text | `#555555` |
| Tertiary / very dim | `#333333` / `#2a2a2a` |
| Brand purple | `#7c3aed` |
| Brand purple hover | `#8b5cf6` |
| Brand purple light | `#a78bfa` |
| Brand dim bg | `rgba(124, 58, 237, 0.12)` |
| Brand dim bg (stronger) | `rgba(124, 58, 237, 0.15)` |
| Brand glow shadow | `rgba(124, 58, 237, 0.5)` |
| Default border | `rgba(255, 255, 255, 0.06)` |
| Default border (panels) | `rgba(255, 255, 255, 0.08)` |
| Hover border | `rgba(255, 255, 255, 0.12)` — `rgba(255, 255, 255, 0.15)` |
| Active border | `rgba(255, 255, 255, 0.18)` — `rgba(255, 255, 255, 0.20)` |
| Positive / green | `#4ade80` |
| Negative / red | `#f87171` |
| Warning / amber | `#f59e0b` |
| Separator dim | `rgba(255, 255, 255, 0.06)` |

CSS variables defined in `globals.css`:
```css
--background: #000000
--surface-1: #0a0a0a
--surface-2: #111111
--surface-3: #1a1a1a
--border: rgba(255, 255, 255, 0.06)
--border-hover: rgba(255, 255, 255, 0.12)
--border-active: rgba(255, 255, 255, 0.18)
--brand: #7c3aed
--brand-hover: #8b5cf6
--brand-light: #a78bfa
--brand-dim: rgba(124, 58, 237, 0.12)
--brand-glow: rgba(124, 58, 237, 0.5)
--text-primary: #ffffff
--text-secondary: rgba(255, 255, 255, 0.6)
--text-tertiary: rgba(255, 255, 255, 0.3)
--positive: #4ade80
--negative: #f87171
--warning: #f59e0b
--radius: 12px
--radius-pill: 9999px
```

---

## Typography

### Fonts
- **Body / UI**: Plus Jakarta Sans — `var(--font-sans)` — loaded via Google Fonts link tag
- **Terminal/Mono labels**: Geist Mono — `var(--font-mono)` — loaded via `GeistMono` from `geist/font/mono`

### Rules
- Nav links, body copy, headings, descriptions, market questions → `var(--font-sans)`
- ALL terminal labels, stats, badges, numbers, section headers, mono data → `var(--font-mono)` via `.font-terminal` class
- Terminal labels: `10–11px`, `tracking-widest`, `uppercase`, mono
- Headings: `font-weight: 800`, `letter-spacing: -0.03em`
- Body: `15px`, `line-height: 1.6`, `font-weight: 400`

### CSS Classes (defined in globals.css — do not remove or change)
```css
.font-terminal {
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.t-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.t-label-accent {
  color: var(--brand-light); /* #a78bfa */
}

.orange-glow {
  color: var(--brand-light);
  text-shadow: 0 0 16px var(--brand-glow);
}
```

---

## Panel System

### `.panel-bracket` (signature component style)
Every major panel/card uses this class. It adds a 3px purple left accent bar via `::before`.

```css
.panel-bracket {
  background-color: var(--surface-2); /* #111 */
  border: 1px solid var(--border);   /* rgba(255,255,255,0.06) */
  border-radius: var(--radius);      /* 12px */
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}
.panel-bracket:hover {
  border-color: var(--border-hover);
  background-color: var(--surface-3);
}
```

Usage pattern:
```tsx
<div className="border panel-bracket"
  style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }}>
```

### Panel hover state (inline override)
```tsx
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = '#161616';
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = '#111';
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
}}
```

### `.panel-strong` (highlighted / STRONG edge card)
```css
.panel-strong {
  border-color: rgba(124, 58, 237, 0.35) !important;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.15);
}
```

---

## Buttons

### Primary CTA (solid purple)
```tsx
style={{ backgroundColor: '#7c3aed', color: '#000', borderRadius: 12 }}
className="font-bold text-sm"
onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8b5cf6'; }}
onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
```

### Secondary / Ghost
```tsx
style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.12)', color: '#a0a0a0', borderRadius: 12 }}
className="border text-sm font-medium"
onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f0f0f0'; }}
onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#a0a0a0'; }}
```

### Terminal quick-action buttons (composer row)
```tsx
style={{
  backgroundColor: isHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
  border: '1px solid',
  borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#888',
}}
className="font-terminal text-xs tracking-wider uppercase"
```

### Disabled state
```tsx
style={{ backgroundColor: '#1a1a1a', color: '#555', borderRadius: 12 }}
```

---

## Navigation (TopNav)

- Height: `h-14` (56px)
- Background: `rgba(0,0,0,0.85)` with `backdropFilter: blur(12px)`
- Bottom border: `rgba(255,255,255,0.06)`
- Max width: `1400px` centered, `px-6`

### Logo
- Text "Pun" in `#ffffff`, `font-extrabold`, `var(--font-sans)`, `tracking-tight`, `text-base`

### Nav Links
- Font: `var(--font-sans)`, `text-sm`, `font-medium`
- Inactive: `rgba(255,255,255,0.5)`, hover `rgba(255,255,255,0.8)` with `rgba(255,255,255,0.05)` bg
- Active: `#ffffff` with `rgba(255,255,255,0.08)` background, `rounded-md`

### Right Status Bar
- Live status pill: `rounded-full`, `rgba(255,255,255,0.06)` bg, `rgba(255,255,255,0.08)` border
  - Live: color `#7c3aed`, dot `box-shadow: 0 0 6px rgba(124,58,237,0.8)`
  - Fallback: color `#f59e0b`
  - Loading: color `#666`
- Wallet address badge: `rounded-full`, `rgba(74,222,128,0.1)` bg, `rgba(74,222,128,0.2)` border, `#4ade80` text, green dot
- Connect Wallet button: `rounded-full`, `#7c3aed` bg, `#ffffff` text, hover `#8b5cf6`
- AI panel toggle: `rounded-full`, active `rgba(124,58,237,0.15)` bg / `rgba(124,58,237,0.4)` border / `#a78bfa` text

---

## AI Chat Page (Thread / Chat)

### Welcome Screen
- Brand label: `font-terminal text-[10px] tracking-[0.2em] uppercase`, color `#7c3aed`
- Heading "AI Mantle Trading Terminal": `font-terminal text-2xl font-bold tracking-tight`, color `#f0f0f0`
- Live status dot: `w-1.5 h-1.5 rounded-full`, color `#7c3aed`, glow `box-shadow: 0 0 4px rgba(124,58,237,0.6)`
- Subtitle: `text-sm leading-relaxed`, color `#666`
- Suggestion cards: 2×2 grid, `panel-bracket` style, `borderRadius: 12`, hover border `rgba(124,58,237,0.35)`, bg `#161616`
  - Category label: `font-terminal text-[9px] tracking-[0.15em] uppercase`, color `#7c3aed`
  - Title: `text-xs font-semibold`, color `#f0f0f0`
  - Label: `text-[11px]`, color `#555`

### Messages
- Assistant message: `panel-bracket border` with `backgroundColor: '#111'`, `borderRadius: 12`
  - Header: purple dot + "pun AI" label in `font-terminal text-[9px]`, color `#7c3aed`
  - Content: `text-sm leading-relaxed`, color `#e0e0e0`
  - Footer: border-top `rgba(255,255,255,0.06)`, copy + regenerate icon buttons
- User message: right-aligned, `#161616` bg, `rgba(255,255,255,0.1)` border, `#f0f0f0` text, `borderRadius: 12`
- System messages: hidden from view

### Composer
- Outer wrapper: `backgroundColor: '#000000'`
- Input box: `backgroundColor: '#111'`, `borderColor: 'rgba(255,255,255,0.12)'`, `borderRadius: 12`
- Focus: border shifts to `rgba(124,58,237,0.5)` via Tailwind `focus-within:border-[rgba(124,58,237,0.5)]`
- Send button: `backgroundColor: '#7c3aed'`, `color: '#000'`, `borderRadius: 12`, size `size-8`
- Cancel button: transparent, `rgba(255,255,255,0.2)` border, `borderRadius: 12`
- Voice button: `rgba(255,255,255,0.08)` bg, `rgba(255,255,255,0.12)` border, `borderRadius: 12`; active: `#ef4444` bg
- Quick action buttons: `font-terminal text-xs tracking-wider uppercase`, `borderRadius: 12`

### Slash Command Palette
- `backgroundColor: '#111'`, `borderColor: 'rgba(124,58,237,0.4)'`, `borderRadius: 12`
- Selected item: `rgba(124,58,237,0.12)` bg
- Command text: `font-terminal text-[11px]`, color `#7c3aed`
- Label text: `text-xs`, color `#a0a0a0`

### Typing Indicator
- 3 purple bouncing dots + "Thinking" in `font-terminal text-[10px]`, color `#555`

---

## Trade Simulation Card (BetSimulation)

### Modal overlay
- `rgba(0,0,0,0.75)` backdrop, `backdropFilter: blur(4px)`
- Card: `max-w-md`, `backgroundColor: '#111'`, `borderRadius: 12`, `borderColor: 'rgba(255,255,255,0.12)'`

### Header
- Label: `font-terminal text-[10px] font-bold tracking-widest uppercase`, color `#a0a0a0`
- Mode badge: `borderRadius: 12`
  - Live: `#4ade80` text, `rgba(74,222,128,0.3)` border, `rgba(74,222,128,0.08)` bg
  - Paper: `#f59e0b` text, `rgba(245,158,11,0.3)` border, `rgba(245,158,11,0.08)` bg

### Data cells
- `backgroundColor: '#000000'`, `borderRadius: 12`, `borderColor: 'rgba(255,255,255,0.08)'`
- Label: `font-terminal text-[10px] tracking-widest uppercase`, color `#555`
- Value: `text-sm font-bold font-terminal`, color `#f0f0f0`
- Action value: color `#7c3aed`

### Dollar sizing input
- Quick-select buttons: `borderRadius: 12`, active: `#7c3aed` border + text + `rgba(124,58,237,0.08)` bg

### Payout highlight box
- `panel-bracket`, `backgroundColor: '#000000'`, `borderColor: 'rgba(124,58,237,0.2)'`, `borderRadius: 12`
- Payout value: `text-3xl font-terminal font-bold`, color `#7c3aed`, glow `textShadow: '0 0 16px rgba(124,58,237,0.35)'`
- Return value: `text-3xl font-terminal font-bold`, color `#7c3aed`

---

## Edge Results (OpportunityCard)

- Card: `panel-bracket border`, `backgroundColor: '#111'`, `borderRadius: 12`
- STRONG card: also has `.panel-strong` class (purple border + glow)
- Strength badge: `borderRadius: 12`
  - STRONG: `#7c3aed` text, `rgba(124,58,237,0.15)` bg, `rgba(124,58,237,0.6)` border
  - MODERATE: `#f0f0f0` text, `rgba(255,255,255,0.08)` bg
  - WEAK: `#777` text, `rgba(255,255,255,0.05)` bg
- Price: `text-2xl font-terminal font-bold`
  - STRONG: color `#7c3aed`, glow `textShadow: '0 0 16px rgba(124,58,237,0.35)'`
- Stats row: `font-terminal text-[10px] tracking-wider`, color `#555`
- Reasoning: `text-sm leading-relaxed`, color `#a0a0a0`, left border `rgba(255,255,255,0.08)`
- Primary button (Simulate): `backgroundColor: '#7c3aed'`, `color: '#000'`, `borderRadius: 12`
- Secondary button (Ask AI): ghost, `borderRadius: 12`
- Tertiary button (Alert): icon-only ghost, `borderRadius: 12`

---

## Market Feed (MarketFeed)

- Market cards: `panel-bracket border`, `borderRadius: 12`
  - Default: `backgroundColor: 'transparent'`, `borderColor: 'rgba(255,255,255,0.08)'`
  - Selected: `backgroundColor: '#1a1a1a'`, `borderColor: 'rgba(124,58,237,0.4)'`
  - Hover: `backgroundColor: '#161616'`, `borderColor: 'rgba(255,255,255,0.15)'`
- Probability color: `>= 65%` → `#7c3aed`, `>= 40%` → `#f0f0f0`, else `#a0a0a0`
- Change color: positive `#4ade80`, negative `#f87171`, no data `#444`
- Loading skeleton: `animate-pulse`, `backgroundColor: '#161616'`, `borderRadius: 12`

---

## Alerts Panel

- Container: `backgroundColor: '#111'`, `borderRadius: 12`
- Header border: `rgba(255,255,255,0.06)`
- Notification toggle: `borderRadius: 12`
  - On: `rgba(74,222,128,0.3)` border, `rgba(74,222,128,0.08)` bg, `#4ade80` text
  - Off: `rgba(255,255,255,0.1)` border
- Add Alert button: `borderRadius: 12`, active: `#7c3aed` border + text
- Alert items: `backgroundColor: '#000000'`, `borderRadius: 12`
- Condition badge: no border-radius on the badge itself (inline span)
  - Above: `#4ade80` text, `rgba(74,222,128,0.1)` bg
  - Below: `#f87171` text, `rgba(248,113,113,0.1)` bg
- Save Alert button: `borderRadius: 12`, active: `#7c3aed` bg + `#000` text

---

## Layout Rules

- Max content width: `1400px`, `mx-auto`, `px-4`
- Desktop grid: `grid-cols-12`, `gap-5`
- All spacing between panels: `space-y-5` or `gap-5`
- Page padding top: `pt-12` (accounts for fixed TopNav `h-14`)
- Page padding bottom: `pb-16 lg:pb-0` (accounts for mobile bottom nav)
- Content padding: `py-6`
- All panels, cards, inputs, buttons: `borderRadius: 12`
- Nav pills and wallet badge: `rounded-full` (pill)
- Scroll-to-bottom button only: `rounded-none`

---

## Skeleton / Loading States

```tsx
<div className="animate-pulse border"
  style={{ backgroundColor: '#161616', borderColor: 'rgba(255,255,255,0.05)', borderRadius: 12 }} />
```

---

## Scrollbar

```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
```

---

## Animations

- `fade-in`: `opacity: 0, translateY(8px)` → `opacity: 1, translateY(0)`, `0.2s ease`
- `animate-in` class applies `fade-in` forwards
- `animate-bounce` on typing indicator dots
- `animate-spin` on loading spinners
- `animate-pulse` on skeleton loaders
- Motion/React (`motion/react-m`) used for welcome screen entrance animations with staggered delays

---

## Mobile Layout

- TopNav: same as desktop, hamburger menu replaces nav links below `sm` breakpoint
- Mobile dropdown: `backgroundColor: '#000000'`, `borderColor: 'rgba(255,255,255,0.06)'`
- Mobile nav links: `rounded-lg`, active: `rgba(124,58,237,0.12)` bg
- Mobile bottom nav: fixed bottom, 5 tabs
- Trade page mobile tabs: Markets / Trending / Analysis / AI
  - Active tab: `#7c3aed` text, `2px solid #7c3aed` bottom border
  - Inactive: `#555`
- Portfolio mobile tabs: Portfolio / Chart / Alerts / Guards / History

---

## Interaction Patterns

### Hover States
All interactive elements use `0.15–0.2s ease` transitions. Never use instant color switches.

```tsx
// Panel hover
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = '#161616';
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
  e.currentTarget.style.transition = 'all 0.15s ease';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.backgroundColor = '#111';
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
}}
```

### Press / Active State
All clickable buttons must have a press feedback via `scale(0.98)`:

```tsx
onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
```

### Focus States
```css
:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## Entrance Animations

Pun uses `motion/react` (`motion/react-m`) for entrance animations. Every major content section animates on mount.

### Standard fade-in-up
```tsx
import { LazyMotion, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';

<m.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>
```

### Staggered list items (cards, market rows)
```tsx
{items.map((item, index) => (
  <m.div
    key={item.id}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
  >
    {/* card content */}
  </m.div>
))}
```

### Rules
- Max stagger delay: `index * 0.04s` (cap at 10 items = 0.4s total)
- Always use `domAnimation` lazy feature set for performance
- Always wrap in `<LazyMotion features={domAnimation}>` and `<MotionConfig reducedMotion="user">`
- Use `y: 8` (not `y: 16` or more) for subtle lift
- Duration: `0.2s` for cards, `0.15s` for micro-elements

---

## Panel System — Overflow Fix

### Critical: overflow hidden on panel-bracket
The `.panel-bracket::before` left accent bar uses `position: absolute`. With `border-radius: 12px` on the parent, the bar's corners clip correctly ONLY when `overflow: hidden` is set on the parent. This is required in globals.css:

```css
.panel-bracket {
  overflow: hidden; /* prevents ::before bar from overflowing rounded corners */
}
```

---

## Status Indicators

### Live pulse dot
Only pulse when actively live. Static when fallback or idle.

```tsx
<span
  className={`w-1.5 h-1.5 rounded-full ${isLive ? 'animate-pulse' : ''}`}
  style={{ backgroundColor: isLive ? '#7c3aed' : isFallback ? '#f59e0b' : '#444' }}
/>
```

### Toast notifications
ALL toasts (success, error, info) must use the same dark style:

```tsx
// Success
toast.success('Message', {
  style: { background: '#111', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 },
  iconTheme: { primary: '#4ade80', secondary: '#111' },
});

// Error
toast.error('Message', {
  style: { background: '#111', color: '#f0f0f0', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 12 },
  iconTheme: { primary: '#f87171', secondary: '#111' },
});

// Info / warning
toast('Message', {
  style: { background: '#111', color: '#f0f0f0', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 12 },
});
```

---

## Form Elements

### Input fields
```tsx
<input
  style={{
    backgroundColor: '#000000',
    borderColor: 'rgba(255,255,255,0.12)',
    color: '#f0f0f0',
    borderRadius: 12,
  }}
  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; }}
  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
/>
```

### Input with attached button (search bar pattern)
The button must match the input's right border-radius:
```tsx
<div className="relative">
  <input style={{ borderRadius: 12, paddingRight: '80px' }} />
  <button
    style={{
      position: 'absolute', right: 0, top: 0, bottom: 0,
      borderRadius: '0 12px 12px 0',  // only right side rounded
      backgroundColor: '#7c3aed',
      color: '#000',
    }}
  />
</div>
```

### Select / dropdown
Use the Popover pattern (not native `<select>`):
- Trigger: same style as ghost button, `borderRadius: 12`
- Content: `backgroundColor: '#111'`, `borderColor: 'rgba(255,255,255,0.12)'`, `borderRadius: 12`
- Active item: `backgroundColor: '#161616'`, checkmark in `#7c3aed`

---

## Empty States

Use the `EmptyState` component from `components/ui/empty-state.tsx`.

SVG icons in empty states use `rx="3"` or `rx="4"` on rect elements (not `rx="0"`) to match the rounded design system.

```tsx
<EmptyState variant="alerts" />
<EmptyState variant="positions" />
<EmptyState variant="history" />
<EmptyState variant="wallet" />
<EmptyState variant="markets" />
<EmptyState variant="orderbook" />
```

Custom empty state:
```tsx
<EmptyState
  title="No results"
  description="Try adjusting your filters"
  action={<button style={{ backgroundColor: '#7c3aed', color: '#000', borderRadius: 12 }}>Reset</button>}
/>
```

---

## Onboarding / Modal Patterns

### Overlay
```tsx
style={{
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(8px)',
}}
```

### Modal card
```tsx
style={{
  backgroundColor: '#0a0a0a',
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: 12,
}}
```

### Top accent line
Every modal has a 2px purple top accent line:
```tsx
<div className="h-[2px]" style={{ backgroundColor: '#7c3aed' }} />
```

### Progress indicator (step dots)
Active dot expands width, uses `transition: width 0.3s ease` (not `transition: all`):
```tsx
style={{
  width: i === step ? 20 : 6,
  height: 6,
  backgroundColor: i === step ? '#7c3aed' : i < step ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.08)',
  transition: 'width 0.3s ease, background-color 0.3s ease',  // width + color only, not 'all'
  borderRadius: 12,
}}
```

### Progress bar (linear)
```tsx
<div className="h-[1px]" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
  <div style={{
    width: `${progress}%`,
    height: '100%',
    backgroundColor: '#7c3aed',
    transition: 'width 0.4s ease',
  }} />
</div>
```

### Terminal window chrome
The 3 dots in terminal chrome: all use `borderRadius: '50%'` (circles):
```tsx
<div className="flex gap-1.5">
  <div className="w-2 h-2" style={{ backgroundColor: '#2a2a2a', borderRadius: '50%' }} />
  <div className="w-2 h-2" style={{ backgroundColor: '#2a2a2a', borderRadius: '50%' }} />
  <div className="w-2 h-2" style={{ backgroundColor: '#7c3aed', borderRadius: '50%', boxShadow: '0 0 4px rgba(124,58,237,0.4)' }} />
</div>
```

---

## What Agents MUST NEVER Do

- Use `border-radius: 0` on panels, cards, inputs, or buttons — the system uses `12px`
- Use `border-radius: 0` on the Connect Wallet button or wallet badge — they use `rounded-full`
- Use colors outside the palette above
- Use `font-size` larger than `text-2xl` for terminal number labels
- Add gradients or box shadows (except `.panel-strong` glow)
- Change `#7c3aed` to any other purple shade
- Use Tailwind's default color classes (`blue-500`, `gray-300`, etc.) — always use inline styles with the palette values
- Remove the `panel-bracket` left purple bar from panels
- Change the TopNav height from `h-14`
- Use `var(--font-sans)` for terminal/mono labels — use `var(--font-mono)` or `.font-terminal`
- Use `var(--font-mono)` for body copy or nav links — use `var(--font-sans)`
