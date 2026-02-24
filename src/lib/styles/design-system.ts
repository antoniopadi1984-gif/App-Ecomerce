import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, ui } from "./tokens";

export { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, ui };

export const ds = {
    spacing: {
        xs: SPACING.xs,
        sm: SPACING.sm,
        md: SPACING.md,
        lg: SPACING.lg,
        xl: SPACING.xl,
    },

    card: {
        padding: 'p-2',
        gap: 'gap-1.5',
        shadow: SHADOWS.sm,
        border: 'border border-slate-100/60',
        radius: 'rounded-lg',
        hover: 'hover:shadow-indigo-500/5 transition-all duration-300',
    },

    typography: {
        h1: `${TYPOGRAPHY.sizes.h1} ${TYPOGRAPHY.weights.black} ${TYPOGRAPHY.tracking.tight} uppercase italic`,
        h2: `${TYPOGRAPHY.sizes.h2} ${TYPOGRAPHY.weights.black} ${TYPOGRAPHY.tracking.tight} uppercase`,
        h3: `${TYPOGRAPHY.sizes.compact} ${TYPOGRAPHY.weights.black} ${TYPOGRAPHY.tracking.tight} uppercase`,
        h4: 'text-[9px] font-black tracking-wider uppercase',
        body: `${TYPOGRAPHY.sizes.body} leading-tight`,
        small: 'text-[9px] font-medium leading-none',
        caption: 'text-[8px] font-bold uppercase tracking-widest',
    },

    glass: {
        base: 'bg-white/60 border border-white/40 shadow-sm',
        premium: 'bg-white/40 border border-white/50 shadow-xl shadow-indigo-500/5',
        dark: 'bg-slate-900/80 border border-slate-800/50 shadow-2xl',
        input: 'bg-white/20 border border-white/30 focus:bg-white/40 focus:border-indigo-500/50 transition-all',
    },

    effects: {
        glow: 'after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[0_0_15px_rgba(79,70,229,0.1)] after:opacity-0 hover:after:opacity-100 after:transition-opacity after:pointer-events-none',
        aura: 'before:absolute before:-top-4 before:-right-4 before:w-24 before:h-24 before:bg-indigo-500/5 before:rounded-full before:blur-2xl before:pointer-events-none',
    }
};
