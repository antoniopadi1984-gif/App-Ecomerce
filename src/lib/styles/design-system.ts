export const ds = {
    spacing: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
    },

    card: {
        padding: 'p-2',          // Reduced from p-3
        gap: 'gap-1.5',         // Reduced from gap-2
        shadow: 'shadow-sm',
        border: 'border border-slate-100/60',
        radius: 'rounded-lg',    // Sharper corners for a more technical look
        hover: 'hover:shadow-indigo-500/5 transition-all duration-300',
    },

    typography: {
        h1: 'text-lg font-black tracking-tight uppercase italic', // Shrunk from 2xl
        h2: 'text-sm font-black tracking-tight uppercase',       // Shrunk from lg
        h3: 'text-[11px] font-black tracking-tight uppercase',    // Shrunk from sm
        h4: 'text-[9px] font-black tracking-wider uppercase',     // Shrunk from 11px
        body: 'text-[11px] leading-tight',                       // Shrunk from 13px
        small: 'text-[9px] font-medium leading-none',            // Shrunk from 11px
        caption: 'text-[8px] font-bold uppercase tracking-widest', // Shrunk from 10px
    },

    glass: {
        base: 'bg-white/60 backdrop-blur-md border border-white/40 shadow-sm',
        premium: 'bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl shadow-indigo-500/5',
        dark: 'bg-slate-900/80 backdrop-blur-md border border-slate-800/50 shadow-2xl',
        input: 'bg-white/20 backdrop-blur-sm border border-white/30 focus:bg-white/40 focus:border-indigo-500/50 transition-all',
    },

    effects: {
        glow: 'after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[0_0_15px_rgba(79,70,229,0.1)] after:opacity-0 hover:after:opacity-100 after:transition-opacity after:pointer-events-none',
        aura: 'before:absolute before:-top-4 before:-right-4 before:w-24 before:h-24 before:bg-indigo-500/5 before:rounded-full before:blur-2xl before:pointer-events-none',
    }
};
