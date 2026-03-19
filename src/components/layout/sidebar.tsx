'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navigation } from '@/lib/nav';
import { X, ChevronDown } from 'lucide-react';

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
  const [openItem, setOpenItem] = useState<string | null>(null);
  const pathname = usePathname();

  const handleHover = (h: boolean) => {
    setIsHovering(h);
    onHoverChange?.(h);
    if (!h) setOpenItem(null);
  };

  const isExpanded = isHovering || isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        onMouseEnter={() => handleHover(true)}
        onMouseLeave={() => handleHover(false)}
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] bg-[var(--surface)] border-r border-[var(--border)] shadow-sm",
          "flex flex-col transition-[width,transform] duration-200 ease-in-out",
          "max-md:w-[240px] max-md:absolute",
          isMobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "md:translate-x-0",
          !isMobileOpen && (isExpanded ? "md:w-[204px]" : "md:w-[52px]")
        )}
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-[50px] px-4 border-b border-[var(--border)] shrink-0">
          <span className="font-bold text-[var(--text)] text-[14px]">Menú</span>
          <button onClick={toggleSidebar} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        {/* Desktop Spacer */}
        <div className="hidden md:flex h-[50px] shrink-0 items-center justify-center border-b border-[var(--border)]" />

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col gap-0.5 px-2">
          {navigation.map((item: any) => {
            const modulePath = item.href.split('/')[1];
            const isActive = pathname.startsWith('/' + modulePath);
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openItem === item.id || isActive;
            const showChildren = isExpanded && hasChildren && isOpen;

            return (
              <div key={item.id} className="flex flex-col gap-0.5">
                <Link
                  href={item.href}
                  title={!isExpanded ? item.label : undefined}
                  onClick={() => {
                    if (hasChildren) {
                      setOpenItem(prev => prev === item.id ? null : item.id);
                    }
                    if (window.innerWidth < 768 && toggleSidebar) {
                      toggleSidebar();
                    }
                  }}
                  className={cn(
                    "relative flex items-center h-9 px-2 rounded-xl transition-all duration-150 ease-in-out group",
                    isActive ? "font-bold" : "font-semibold text-slate-500 hover:bg-slate-100"
                  )}
                  style={{
                    backgroundColor: isActive ? item.colorMuted : undefined,
                    color: isActive ? item.color : undefined,
                  } as any}
                >
                  <div className={cn(
                    "flex items-center justify-center shrink-0 transition-all",
                    isExpanded ? "w-6 mr-2 text-[20px]" : "w-full text-[20px]"
                  )}>
                    {item.emoji}
                  </div>

                  {isExpanded && (
                    <>
                      <span className="text-[12px] truncate flex-1 uppercase tracking-tight">
                        {item.label}
                      </span>
                      {hasChildren && (
                        <ChevronDown
                          size={14}
                          className={cn(
                            "transition-transform text-[var(--text-dim)] mr-1",
                            isOpen ? "rotate-180 opacity-100" : "opacity-40"
                          )}
                        />
                      )}
                    </>
                  )}
                </Link>

                {showChildren && (
                  <div className="flex flex-col gap-0.5 mt-1 mb-2 animate-in slide-in-from-top-1 duration-200">
                    {item.children.map((child: any) => {
                      const isSubActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => {
                            if (window.innerWidth < 768 && toggleSidebar) {
                              toggleSidebar();
                            }
                          }}
                          className={cn(
                            "flex items-center h-8 transition-all duration-150 rounded-lg",
                            isSubActive
                              ? "text-[11px] bg-slate-50"
                              : "text-[11px] text-[#475569] hover:bg-slate-50"
                          )}
                          style={{
                            borderLeft: isSubActive ? `2px solid ${item.color}` : '2px solid transparent',
                            color: isSubActive ? item.color : undefined,
                            fontWeight: isSubActive ? 600 : 400,
                            paddingLeft: '12px'
                          } as any}
                        >
                          <span className="mr-2 text-[14px]">{child.emoji}</span>
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
