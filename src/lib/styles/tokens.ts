/**
 * Design Tokens - Phase 0 Immutable Foundation
 * Centralized source of truth for colors, spacing, and typography.
 */

export const COLORS = {
    // Primary / Brand
    primary: 'var(--primary)',
    primaryStrong: 'var(--alert-critical)',
    primaryPastel: '#fff1f2',

    // Backgrounds & Surfaces
    bg: 'var(--bg)',
    surface: 'var(--surface)',
    surfaceOpaque: 'var(--surface-opaque)',
    surfaceMuted: 'var(--surface-2)',

    // Alerts & Status
    error: 'var(--alert-critical)',
    warning: 'var(--alert-warning)',
    success: 'var(--alert-ok)',
    info: 'var(--alert-info)',

    // Grays (Slate)
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },

    border: 'var(--border)',
    borderHighlight: 'var(--border-highlight)',
};

export const SPACING = {
    none: '0',
    xs: 'var(--item-gap-tight)',    // 0.25rem / 4px
    sm: 'var(--item-gap)',          // 0.375rem / 6px
    md: 'var(--section-gap-tight)', // 0.5rem / 8px
    lg: 'var(--section-gap)',       // 0.75rem / 12px
    xl: '1rem',                     // 16px

    // Layout
    headerHeight: 'var(--header-height)',
    sidebarWidth: 'var(--sidebar-width)',
    sidebarCollapsed: 'var(--sidebar-collapsed)',
    rowHeight: 'var(--row-height)',
};

export const TYPOGRAPHY = {
    fontSans: "'Outfit', sans-serif",
    sizes: {
        h1: 'text-[20px]',     // Legible h1
        h2: 'text-[16px]',     // Legible h2
        subtitle: 'text-[13px]',
        body: 'text-[11px]',
        compact: 'text-[10px]',
        tiny: 'text-[9px]',
        micro: 'text-[8px]',
    },
    weights: {
        light: 'font-light',
        normal: 'font-medium',
        bold: 'font-bold',
        black: 'font-black',
    },
    tracking: {
        tight: 'tracking-tight',
        wide: 'tracking-wider',
        widest: 'tracking-[0.15em]',
    }
};

export const SHADOWS = {
    sm: 'shadow-sm',
    premium: 'var(--shadow-premium)',
    glass: 'var(--glass-shadow)',
};

export const RADIUS = {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
};

/**
 * Utility to generate standard component classes
 */
export const ui = {
    card: "bg-white/70 border border-white/40 shadow-sm rounded-xl glass-card",
    cardCompact: "bg-white/70 border border-white/40 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] rounded-lg p-2 gap-1.5 glass-card",
    button: "h-6 px-2 rounded bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50",
    input: "h-6 px-2 bg-white/40 border border-slate-200/50 rounded text-[11px] font-medium outline-none focus:border-rose-400/50 transition-all glass-input",
    label: "text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5 block",
};
