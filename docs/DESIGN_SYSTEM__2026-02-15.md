# Design System Spec - Light Premium Enterprise SaaS
**Date: 2026-02-15**

## 1. Core Principles
- **No Dark Theme**: Pure light-mode experience for maximum clarity and "clean" aesthetic.
- **Monochrome-First Tables**: Colors are prohibited in data rows. Status is conveyed via Icon + Texture/Text (Grays/Blacks).
- **Surgical Color Usage**: Color is reserved for High-impact Alerts, CTAs, and active highlights.

## 2. Tokens & Variables (globals.css)

### Colors
| Token | Value | usage |
| :--- | :--- | :--- |
| `--bg` | `#F6F7F9` | App background |
| `--surface` | `#FFFFFF` | Cards, Sidebar, TopBar |
| `--surface-2` | `#F9FAFB` | Secondary surfaces, headers |
| `--border` | `#E5E7EB` | Dividers, Borders |
| `--text` | `#111827` | Primary text |
| `--muted` | `#6B7280` | Labels, helper text |
| `--primary` | `#1D4ED8` | Primary CTA, focus |
| `--primary-2` | `#2563EB` | Hover/Active states |

### Alert Scalation (Alerts Only)
- `--alert-critical`: `#DC2626`
- `--alert-warning`: `#D97706`
- `--alert-ok`: `#16A34A`
- `--alert-info`: `#2563EB`

### Typography
- **Font Family**: Outfit
- **Body Base**: `12px / 500 weight`
- **Labels/Headers**: `10px / 700 weight / Uppercase tracking`
- **Page Titles (H1)**: `18px / 800 weight`

## 3. Component Specs

### Table Density
- **Row Height**: 36px (Max)
- **Cell Padding**: 8px horizontal
- **Style**: Monochrome. No zebra striping unless very subtle. No colored badges in cells.

### MetricTile (KPIs)
- **Height**: Auto (Compact)
- **Structure**:
  - Top: Label (10px Bold Muted Uppercase)
  - Middle: Value (16px Black Bold)
  - Bottom: Trend/Subtext (10px)

### Buttons & Inputs
- **Base Height**: 32px
- **Border Radius**: 6px
- **Shadow**: Subtle 1px ring or low blur shadow.

## 4. Layout Layout
- **Sidebar**: Light background. Item active state: `slate-950` with white text.
- **TopBar**: 3-Zone pattern. Selectors on Left (max 42% width), Icons + Pills on Right.
- **Page Content**: Margins standard 16px. Gap between cards 12px.
