'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navigation } from '@/lib/nav';
import { Menu, X } from 'lucide-react';

export function Sidebar({
  isOpen: isMobileOpen,
  toggleSidebar,
  onHoverChange
}: {
  isOpen?: boolean;
  toggleSidebar?: () => void;
  onHoverChange?: (hovering: boolean) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  const handleHover = (h: boolean) => {
    setIsHovering(h);
    onHoverChange?.(h);
  };

  const isExpanded = isHovering || isMobileOpen;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Desktop (hover expand) & Mobile (drawer) */}
      <aside
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] bg-[var(--surface)] border-r border-[var(--border)] shadow-sm",
          "flex flex-col overflow-hidden transition-[width,transform] duration-200 ease-in-out",
          // Mobile state
          "max-md:w-[240px] max-md:absolute",
          isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          // Desktop state
          "md:translate-x-0",
          !isMobileOpen && (isExpanded ? "md:w-[var(--sidebar-w-exp,204px)]" : "md:w-[var(--sidebar-w,52px)]")
        )}
      >
        {/* Mobile Header (only visible on mobile) */}
        <div className="md:hidden flex items-center justify-between h-[var(--topbar-h,50px)] px-4 border-b border-[var(--border)] shrink-0">
          <span className="font-bold text-[var(--text)] text-[14px]">Menú</span>
          <button onClick={toggleSidebar} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        {/* Desktop Spacer (matches topbar height so items align below it ideally, or not - design preference) */}
        <div className="hidden md:flex h-[var(--topbar-h,50px)] shrink-0 items-center justify-center border-b border-[var(--border)]">
          {/* Optionally put a mini logo here, but ultra compact says just spacer */}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-1 px-[6px]">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 768 && toggleSidebar) {
                    toggleSidebar();
                  }
                }}
                className={cn(
                  "flex items-center h-10 rounded-[var(--r-md)] transition-colors relative cursor-pointer",
                  !isExpanded ? "justify-center" : "px-3 gap-3",
                  isActive ? "bg-opacity-10" : "hover:bg-[var(--surface2)]"
                )}
                style={isActive ? { backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)` } : {}}
              >
                {/* Active Indicator Bar (only when collapsed or as an accent) */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[60%] rounded-r-full"
                    style={{ backgroundColor: item.color }}
                  />
                )}

                {/* Icon */}
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ color: isActive ? item.color : 'var(--text-muted)' }}
                >
                  <item.icon size={20} strokeWidth={2} />
                </div>

                {/* Label */}
                {isExpanded && (
                  <span
                    className="text-[12px] font-semibold whitespace-nowrap overflow-hidden transition-colors"
                    style={{ color: isActive ? item.color : 'var(--text-muted)' }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  );
}
