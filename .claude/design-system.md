# Ancon Design System

**Project:** Government/Business Project Management CRM
**Language:** Hebrew (RTL)
**Theme:** Professional, governmental, dual mode (light/dark)

## Colors

### Primary (Royal Blue)
```
Primary: #0f2cbd
Primary Hover: #0a1f8a
Royal Gray: #334155
Royal Gray Dark: #1e293b
```

### Light Mode
```
Background: #f8fafc (Slate 50)
Surface: #ffffff
Text Main: #0f172a (Slate 900)
Text Secondary: #64748b (Slate 500)
Border: #cbd5e1 (Slate 300)
```

### Dark Mode
```
Background: #101322
Surface: #1e293b (Slate 800)
Text Main: #f1f5f9 (Slate 100)
Text Secondary: #94a3b8 (Slate 400)
Border: #334155 (Slate 700)
```

### Semantic Colors
```
Success: #10b981 (Emerald)
Warning: #f59e0b (Amber)
Error: #ef4444 (Red)
Info: #3b82f6 (Blue)
```

## Typography

**Font:** Heebo (sans-serif, optimized for Hebrew)

### Sizes
```
Display: 32px
H1: 24px
H2: 20px
H3: 18px
Body: 16px
Small: 14px
Tiny: 12px
```

### Weights
```
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

## Spacing

**Base: 4px**

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

## Borders & Radius

```
Default: 2px (sharp, governmental)
Large: 4px
XL: 6px
Full: 9999px (pills, avatars)
```

## Layout

### RTL Configuration
```css
html[dir="rtl"] {
  direction: rtl;
  text-align: right;
}
```

### Grid System
- Dashboard: 12-column grid
- Cards: Consistent padding (16px)
- Tables: Zebra striping, hover states

## Components

### Primary Button
```
Background: #0f2cbd
Text: White
Padding: 10px 20px
Border radius: 4px
Hover: #0a1f8a
Active: Slight scale down
```

### Secondary Button
```
Background: Transparent
Border: 1px solid current color
Text: Primary color
Hover: Light background tint
```

### Cards
```
Background: surface color
Border: 1px solid border color
Border radius: 4px
Padding: 16px
Shadow: Subtle (0 1px 3px rgba(0,0,0,0.1))
```

### Tables
```
Header: Royal gray background
Rows: Alternating (zebra striping)
Hover: Light background change
Border: Subtle borders between rows
```

### Forms
```
Input height: 40px
Border: 1px solid border color
Focus: Primary color border
Border radius: 4px
Label: Bold, above input
```

## Animations

**Duration:** Fast, professional

```
Fast: 200ms
Normal: 300ms
Slow: 400ms
```

**Keyframes:**
- Fade in/out
- Slide (up, down, left, right)
- Scale in
- Modal enter/exit
- Skeleton loading
- Shake (errors)
- Checkmark (success)

**Timing:**
```
Smooth: cubic-bezier(0.4, 0, 0.2, 1)
Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

## Iconography

**Library:** Lucide icons or similar
**Size:** 20px default
**Stroke:** 2px
**Style:** Line icons, professional

## Dark Mode Toggle

**Switching:**
- System preference detection
- Manual toggle in settings
- Persist preference in localStorage
- Smooth transition (300ms)

## Accessibility

**Contrast ratios:** WCAG AA minimum
**Focus indicators:** Clear blue outline
**Keyboard navigation:** Full support
**Screen readers:** Proper ARIA labels
**RTL support:** Complete Hebrew RTL

## Data Visualization

**Charts:**
- Clean, minimalist
- Primary color for main data
- Gray scale for secondary
- Tooltips on hover

## Status Indicators

```
Active/Success: Green
Pending/Warning: Amber
Inactive/Error: Red
Info: Blue
```

## Best Practices

- Use Heebo font for all Hebrew text
- Maintain RTL consistency
- Keep governmental professionalism
- Support both light and dark modes
- Subtle animations (professional, not playful)
- Clear data hierarchy in dashboards
