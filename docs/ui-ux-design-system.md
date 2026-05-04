# Pun — UI/UX Design System

**Last updated:** May 2026

---

## Design Foundation

Pun's visual design is built directly on **Kiro's design system** ([kiro.dev](https://kiro.dev)). The `globals.css` was seeded from Kiro's starter template — the CSS variable naming convention (`--brand`, `--brand-hover`, `--brand-light`, `--brand-dim`, `--brand-glow`, `--surface-1/2/3`), the purple brand color `#7c3aed`, the font pairing (Plus Jakarta Sans body + Geist Mono terminal), the `border-radius: 12px` card system, the pill badge pattern, and the backdrop-blur nav are all Kiro design primitives.

Pun extends this foundation with a **terminal data layer** on top: `.font-terminal` mono labels, `.panel-bracket` left-accent bars, dense information grids, and the `panel-strong` purple glow for highlighted cards. The entrance animations (`motion/react`, `fade-in`, staggered delays) also follow Kiro's animation patterns.

In short: **Kiro's design system is the base. Pun's terminal/DeFi layer is the extension.**

---

## Design Philosophy

**Dark terminal dashboard with soft modern edges.** Dense, information-first layout with a purple brand accent and a consistent 12px card radius system.

- `border-radius: 12px` on all panels, cards, inputs, buttons, and modals
- `border-radius: 9999px` (pill) on nav status pills, wallet badge, and Connect Wallet button
- Subtle backdrop blur on the TopNav
- No gradients
- No box shadows except the brand glow on highlighted panels

---

## Color Palette

| Purpose | Value |
|---|---|
| Page background | `#000000` |
| Surface 1 | `#0a0a0a` |
| Panel background | `#111111` |
| Panel hover | `#161616` |
| Panel active / selected | `#1a1a1a` |
| Primary text | `#ffffff` / `#f0f0f0` |
| Secondary text | `#a0a0a0` |
| Muted / disabled | `#555555` |
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

---

## Typography

**Body / UI:** Plus Jakarta Sans — `var(--font-sans)` — loaded via Google Fonts link tag

**Terminal/Mono labels:** Geist Mono — `var(--font-mono)` — loaded via `GeistMono` from `geist/font/mono`

Rules:
- Nav links, body copy, headings, descriptions, market questions → `var(--font-sans)`
- ALL terminal labels, stats, badges, numbers, section headers, mono data → `var(--font-mono)` via `.font-terminal`
- Terminal labels: `10–11px`, `tracking-widest`, `uppercase`, mono
- Headings: `font-weight: 800`, `letter-spacing: -0.03em`
- Body: `15px`, `line-height: 1.6`, `font-weight: 400`

CSS classes defined in `globals.css`:

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

Every major panel uses `.panel-bracket` — a 3px purple left accent bar via `::before`.

```css
.panel-bracket {
  background-color: var(--surface-2); /* #111 */
  border: 1px solid var(--border);
  border-radius: var(--radius);       /* 12px */
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}
.panel-bracket:hover {
  border-color: var(--border-hover);
  background-color: var(--surface-3);
}
```

Usage:
```tsx
<div className="border panel-bracket"
  style={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }}>
```

Panel hover state:
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

Highlighted panel (STRONG edge):
```css
.panel-strong {
  border-color: rgba(124, 58, 237, 0.35) !important;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.15);
}
```

---

## Buttons

Primary CTA (solid purple):
```tsx
style={{ backgroundColor: '#7c3aed', color: '#000', borderRadius: 12 }}
className="font-bold text-sm"
onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#8b5cf6'; }}
onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; }}
```

Secondary / Ghost:
```tsx
style={{ backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.12)', color: '#a0a0a0', borderRadius: 12 }}
className="border text-sm font-medium"
onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f0f0f0'; }}
onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#a0a0a0'; }}
```

Terminal quick-action buttons (composer row):
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

---

## Navigation (TopNav)

- Height: `h-14` (56px)
- Background: `rgba(0,0,0,0.85)` with `backdropFilter: blur(12px)`
- Bottom border: `rgba(255,255,255,0.06)`
- Max width: `1400px` centered, `px-6`

Logo:
- Text "Pun" in `#ffffff`, `font-extrabold`, `var(--font-sans)`, `tracking-tight`, `text-base`

Nav links:
- Font: `var(--font-sans)`, `text-sm`, `font-medium`
- Inactive: `rgba(255,255,255,0.5)`, hover `rgba(255,255,255,0.8)` with `rgba(255,255,255,0.05)` bg
- Active: `#ffffff` with `rgba(255,255,255,0.08)` background, `rounded-md`

Right status bar:
- Live status pill: `rounded-full`, `rgba(255,255,255,0.06)` bg, `rgba(255,255,255,0.08)` border
  - Live: color `#7c3aed`, dot glow `box-shadow: 0 0 6px rgba(124,58,237,0.8)`
  - Fallback: color `#f59e0b`
  - Loading: color `#666`
- Wallet address badge: `rounded-full`, `rgba(74,222,128,0.1)` bg, `rgba(74,222,128,0.2)` border, `#4ade80` text + dot
- Connect Wallet button: `rounded-full`, `#7c3aed` bg, `#ffffff` text, hover `#8b5cf6`
- AI panel toggle: `rounded-full`, active `rgba(124,58,237,0.15)` bg / `rgba(124,58,237,0.4)` border / `#a78bfa` text

---

## AI Chat Page (Thread)

### Welcome Screen
- Brand label: `font-terminal text-[10px] tracking-[0.2em] uppercase`, color `#7c3aed`
- Heading: `font-terminal text-2xl font-bold tracking-tight`, color `#f0f0f0`
- Live status dot: `w-1.5 h-1.5 rounded-full`, color `#7c3aed`, glow `box-shadow: 0 0 4px rgba(124,58,237,0.6)`
- Subtitle: `text-sm leading-relaxed`, color `#666`
- Suggestion cards: 2×2 grid, `panel-bracket`, `borderRadius: 12`
  - Hover: border `rgba(124,58,237,0.35)`, bg `#161616`
  - Category label: `font-terminal text-[9px] tracking-[0.15em] uppercase`, color `#7c3aed`
  - Title: `text-xs font-semibold`, color `#f0f0f0`
  - Label: `text-[11px]`, color `#555`

### Messages
- Assistant: `panel-bracket border`, `backgroundColor: '#111'`, `borderRadius: 12`
  - Header: purple dot + "pun AI" in `font-terminal text-[9px]`, color `#7c3aed`
  - Content: `text-sm leading-relaxed`, color `#e0e0e0`
- User: right-aligned, `#161616` bg, `rgba(255,255,255,0.1)` border, `#f0f0f0` text, `borderRadius: 12`

### Composer
- Outer: `backgroundColor: '#000000'`
- Input box: `backgroundColor: '#111'`, `borderColor: 'rgba(255,255,255,0.12)'`, `borderRadius: 12`
- Focus: border `rgba(124,58,237,0.5)`
- Send button: `#7c3aed` bg, `#000` icon, `borderRadius: 12`, `size-8`
- Voice button: `rgba(255,255,255,0.08)` bg, `borderRadius: 12`; active: `#ef4444` bg

### Slash Command Palette
- `backgroundColor: '#111'`, `borderColor: 'rgba(124,58,237,0.4)'`, `borderRadius: 12`
- Selected: `rgba(124,58,237,0.12)` bg
- Command: `font-terminal text-[11px]`, color `#7c3aed`

### Typing Indicator
- 3 purple bouncing dots + "Thinking" in `font-terminal text-[10px]`, color `#555`

---

## Trade Simulation Card (BetSimulation)

- Modal overlay: `rgba(0,0,0,0.75)` backdrop, `blur(4px)`
- Card: `max-w-md`, `backgroundColor: '#111'`, `borderRadius: 12`
- Data cells: `backgroundColor: '#000000'`, `borderRadius: 12`
  - Label: `font-terminal text-[10px] tracking-widest uppercase`, color `#555`
  - Value: `text-sm font-bold font-terminal`, color `#f0f0f0`
- Payout box: `panel-bracket`, `borderColor: 'rgba(124,58,237,0.2)'`, `borderRadius: 12`
  - Value: `text-3xl font-terminal font-bold`, color `#7c3aed`, glow `textShadow: '0 0 16px rgba(124,58,237,0.35)'`

---

## Layout Rules

- Max content width: `1400px`, `mx-auto`, `px-4`
- Desktop grid: `grid-cols-12`, `gap-5`
- All spacing between panels: `space-y-5` or `gap-5`
- Page top padding: `pt-12` (fixed TopNav `h-14`)
- Page bottom padding: `pb-16 lg:pb-0` (mobile bottom nav)
- Content padding: `py-6`
- All panels, cards, inputs, buttons: `borderRadius: 12`
- Nav pills and wallet badge: `rounded-full`

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

## Responsive Layout

Desktop: Multi-column grids (12-col, split 7/5 or full-width when AI panel closed)
Mobile: Tab-based navigation

Trade mobile tabs: Markets / Trending / Analysis / AI
Portfolio mobile tabs: Portfolio / Chart / Alerts / Guards / History

Active tab: `#7c3aed` text, `2px solid #7c3aed` bottom border
Inactive tab: `#555`

---

## Accessibility

- Focus states: `outline: 2px solid var(--brand)`, `outline-offset: 2px`, `border-radius: 4px`
- ARIA labels on all icon-only buttons
- Error boundaries on all data panels
- Empty states for all zero-data scenarios
- Skeleton loading states (no content jump)

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

## What Agents Must Never Do

- Use `border-radius: 0` on panels, cards, inputs, or buttons — the system uses `12px`
- Use `border-radius: 0` on the Connect Wallet button or wallet badge — they use `rounded-full`
- Use colors outside the palette above
- Add gradients or box shadows (except `.panel-strong` glow)
- Change `#7c3aed` to any other purple shade
- Use Tailwind's default color classes (`blue-500`, `gray-300`, etc.) — always use inline styles with the palette values
- Remove the `panel-bracket` left purple bar from panels
- Change the TopNav height from `h-14`
- Use `var(--font-sans)` for terminal/mono labels — use `.font-terminal`
- Use `var(--font-mono)` for body copy or nav links — use `var(--font-sans)`
