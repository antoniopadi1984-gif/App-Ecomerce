'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard, ShoppingCart, Truck, Wallet, BarChart3, Users,
  Sparkles, Video, MessageSquare, FolderOpen, Target, Laptop,
  Microscope, FileText, Globe, TrendingUp, Search, Eye,
  Bot, Settings, Activity, LinkIcon, Sliders, UserCog,
  ChevronDown, Pin, PinOff, Check, Package, Brain
} from 'lucide-react';

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

  // Layers based on UX Architect Specs - PHASE 2 v1.8 UNIFIED
  const layers = [
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/pedidos', icon: ShoppingCart, label: 'Pedidos', badge: 'v2' },
        { href: '/customers', icon: Users, label: 'Customers' },
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      items: [
        { href: '/finances', icon: Wallet, label: 'Contabilidad' },
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      items: [
        { href: '/marketing/facebook-ads', icon: BarChart3, label: 'Ads Manager' },
        { href: '/marketing/ads-moderator', icon: MessageSquare, label: 'Moderador' },
        { href: '/centro-creativo', icon: Laptop, label: 'Creative Hub' },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      items: [
        { href: '/communications/inbox', icon: MessageSquare, label: 'Central Inbox' },
        { href: '/communications/templates', icon: FileText, label: 'Plantillas' },
      ]
    },
    {
      id: 'ai',
      label: 'AI',
      items: [
        { href: '/marketing/product-brain', icon: Brain, label: 'Brain Hub' },
        { href: '/agentes-ia', icon: Bot, label: 'Agentes IA' },
        { href: '/research', icon: Microscope, label: 'Research Lab' },
        { href: '/eagle-eye', icon: Eye, label: 'Eagle Eye' },
      ]
    },
    {
      id: 'admin',
      label: 'Admin',
      items: [
        { href: '/system/health', icon: Activity, label: 'System Health' },
        { href: '/connections', icon: LinkIcon, label: 'Connections' },
        { href: '/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "fixed left-0 top-0 z-50 bg-white border-r border-slate-200 h-screen flex flex-col overflow-visible transition-all duration-300 shadow-sm",
        "max-md:z-[100]",
        isOpen ? "w-60 translate-x-0" : "w-[72px] max-md:-translate-x-full"
      )}
    >
      {/* Logo Section */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 h-14 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-slate-200">
            <span className="text-white font-black text-xs tracking-tighter italic">EB</span>
          </div>
          {isOpen && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-black text-sm tracking-tighter uppercase italic leading-none text-slate-900">EcomBoom</span>
              <p className="text-[8px] text-blue-600 font-bold uppercase tracking-widest leading-none">Control v2.1</p>
            </div>
          )}
        </div>
        {isOpen && togglePinned && (
          <button onClick={togglePinned} className="text-slate-300 hover:text-slate-900 transition-colors">
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Navigation - Section Based */}
      <nav className="flex-1 overflow-y-auto no-scrollbar pt-4">
        {layers.map((layer) => (
          <div key={layer.id} className="mb-4">
            {isOpen && (
              <h3 className="px-5 mb-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{layer.label}</h3>
            )}
            <div className="px-2 space-y-0.5">
              {layer.items.map((item: any, idx: number) => (
                <NavItem
                  key={idx}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isOpen={isOpen}
                  isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                  badge={item.badge}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
            <UserCog className="w-4 h-4 text-slate-900" />
          </div>
          {isOpen && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-slate-900 truncate tracking-tight uppercase px-1">Enterprise Admin</span>
              <span className="text-[9px] text-slate-500 truncate italic bg-slate-200/50 px-1.5 py-0.5 rounded-full w-fit mt-0.5">SaaS OS v1.0</span>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}

function NavItem({ href, icon: Icon, label, isOpen, isActive, badge }: any) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold uppercase tracking-tight group",
        isActive
          ? "bg-[#2563EB] text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
      {isOpen && (
        <span className="truncate tracking-tight flex-1 ml-1">{label}</span>
      )}
      {isOpen && badge && (
        <Badge className={cn(
          "h-4 px-1 text-[8px] border-none font-black uppercase",
          "bg-slate-900 text-white"
        )}>
          {badge}
        </Badge>
      )}
    </Link>
  );
}
