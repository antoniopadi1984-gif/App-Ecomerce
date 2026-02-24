'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  PinOff,
  Pin,
  UserCircle,
  Rocket
} from 'lucide-react';
import { navigation } from '@/lib/nav';

export function Sidebar({
  isOpen: isMobileOpen,
  isPinned,
  togglePinned,
  onHoverChange
}: {
  isOpen?: boolean;
  toggleSidebar?: () => void;
  isPinned: boolean;
  togglePinned: () => void;
  onHoverChange?: (hovering: boolean) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  const handleHover = (h: boolean) => {
    setIsHovering(h);
    onHoverChange?.(h);
  };

  const isOpen = isMobileOpen || isPinned || isHovering;

  return (
    <aside
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      className={cn(
        "fixed left-0 top-0 z-[100] glass-panel border-r border-white/40 h-screen flex flex-col transition-all duration-300 ease-in-out shadow-none",
        "max-md:shadow-sm max-md:w-[280px]",
        isOpen ? "w-[var(--sidebar-width)] translate-x-0" : "w-[var(--sidebar-collapsed)] max-md:-translate-x-full"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "border-b border-white/20 flex items-center shrink-0 h-[var(--header-height)] bg-transparent transition-all",
        isOpen ? "px-3 justify-between" : "justify-center"
      )}>
        <div className={cn("flex items-center overflow-hidden", isOpen ? "gap-2.5" : "gap-0")}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          {isOpen && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-extrabold text-[11px] tracking-tight text-slate-900 uppercase italic leading-none">Factoría <span className="text-primary not-italic">X</span></span>
              <p className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Scale Protocol</p>
            </div>
          )}
        </div>
        {isOpen && (
          <button onClick={togglePinned} className="text-slate-500 hover:text-primary transition-colors mr-1">
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation - Section Based */}
      <nav className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-2">
        {navigation.map((layer) => (
          <div key={layer.id} className="mb-2.5">
            {isOpen && (
              <h3 className="px-3 mb-1 text-[10px] font-black text-slate-600 uppercase tracking-[0.15em]">{layer.label}</h3>
            )}
            <div className="px-2 space-y-0.5">
              {layer.items.map((item, idx) => (
                <NavItem
                  key={idx}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isOpen={isOpen}
                  isActive={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-slate-100/50 shrink-0 bg-transparent flex items-center transition-all",
        isOpen ? "p-3 justify-start" : "py-3 justify-center"
      )}>
        <div className={cn("flex items-center", isOpen ? "gap-3" : "gap-0")}>
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/50 flex items-center justify-center shrink-0 shadow-sm overflow-hidden group">
            <UserCircle className="w-4 h-4 text-slate-400" />
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-900 truncate tracking-tight uppercase">Administrador</span>
              <Badge variant="outline" className="text-[8px] h-3 px-1 mt-0.5 border-slate-200/50 text-slate-500 w-fit bg-white/70">PRO</Badge>
            </div>
          )}
        </div>
      </div>
    </aside >
  );
}

function NavItem({ href, icon: Icon, label, isOpen, isActive }: { href: string; icon: any; label: string; isOpen: boolean; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200 group relative",
        "max-md:py-3 max-md:my-1", // Larger touch target on mobile
        isActive
          ? "bg-rose-500/10 text-rose-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] ring-1 ring-rose-500/20"
          : "text-slate-700 hover:bg-white/60 hover:text-slate-900"
      )}
    >
      <Icon
        strokeWidth={1.5}
        className={cn(
          "w-6 h-6 shrink-0 transition-transform group-hover:scale-110",
          isActive ? "text-rose-600" : "text-slate-950 group-hover:text-black"
        )}
      />
      {isOpen && (
        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-300 uppercase">
          {label}
        </span>
      )}
      {!isOpen && isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-rose-500 rounded-l-full" />
      )}
    </Link>
  );
}
