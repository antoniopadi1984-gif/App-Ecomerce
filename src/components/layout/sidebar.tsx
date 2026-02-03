"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare, Zap, LayoutDashboard, ShoppingCart, Truck, Package,
  BrainCircuit, Settings, Menu, X, ChevronRight, ChevronDown,
  LogOut, LineChart, TrendingUp, Info, History, Save,
  AlertCircle, Target, FlaskConical, Users, BarChart4, PieChart, Repeat, Globe, Archive, Clapperboard, Image as ImageIcon, Bot, Share2, Search, ShieldCheck, Activity, Gift,
  Layout, Video, Layers, Sparkles, Library, GlassWater, SearchCode, Users2, FileSearch, Microscope
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const menuItems = [
  {
    category: "OPERACIONES DIARIAS",
    items: [
      {
        title: "Dashboard Diario",
        icon: BarChart4,
        href: "/logistics/dashboard",
        badge: "LIVE"
      },
      {
        title: "Rendimiento Ads",
        icon: Target,
        href: "/marketing/performance",
        badge: "ROI"
      },
      {
        title: "Contabilidad",
        icon: LineChart,
        href: "/finances",
        badge: "P&L"
      },
      {
        title: "Pedidos",
        icon: ShoppingCart,
        href: "/logistics/orders",
      },
      {
        title: "WhatsApp / Mensajería",
        icon: MessageSquare,
        href: "/communications/inbox",
        submenu: [
          { title: "Bandeja de Entrada", href: "/communications/inbox" },
          { title: "Gestión de Plantillas", href: "/communications/templates" },
        ]
      },
      {
        title: "Logística",
        icon: Truck,
        href: "/logistics/dashboard", // This might need a separate page if Dashboard Diario is different
      },
    ]
  },
  {
    category: "MARKETING Y ASSET LAB",
    items: [
      {
        title: "Moderación (Social)",
        icon: Share2,
        href: "/marketing/social-moderation",
        badge: "PRO"
      },
      {
        title: "Avatar Lab",
        icon: Users,
        href: "/marketing/avatars-lab",
      },
      {
        title: "Creativos",
        icon: Clapperboard,
        href: "/marketing/creative-lab",
      },
      {
        title: "Landings",
        icon: Globe,
        href: "/marketing/landing-lab",
      },
      {
        title: "Clowdbot",
        icon: Bot,
        href: "/marketing/clowdbot-lab",
      },
      {
        title: "Ad Spy",
        icon: Search,
        href: "/marketing/ad-spy",
      },
      {
        title: "Regalos & Contenidos",
        icon: Gift,
        href: "/marketing/contents",
        submenu: [
          { title: "eBooks", href: "/marketing/contents/ebooks" },
          { title: "Mini-Cursos", href: "/marketing/contents/courses" },
          { title: "Tarjetas & Cupones", href: "/marketing/contents/coupons" },
          { title: "Automatizaciones", href: "/marketing/contents/automations" },
        ]
      },
      {
        title: "Creativos & Landings",
        icon: Layout,
        href: "/marketing/creative-lab",
        submenu: [
          { title: "Landing Lab", href: "/marketing/creative-lab/landings" },
          { title: "Advertorial / Listicle", href: "/marketing/creative-lab/articles" },
          { title: "Videos & Creativos", href: "/marketing/creative-lab/videos" },
          { title: "Avatares", href: "/marketing/creative-lab/avatars" },
          { title: "Biblioteca & Versiones", href: "/marketing/creative-lab/library" },
        ]
      },
      {
        title: "Investigación",
        icon: Microscope,
        href: "/marketing/research",
        submenu: [
          { title: "Avatar & Psicología", href: "/marketing/research/avatar" },
          { title: "Foros & Voz Real", href: "/marketing/research/voc" },
          { title: "Ángulos & Mensajes", href: "/marketing/research/angles" },
          { title: "Competencia & Oferta", href: "/marketing/research/competitors" },
          { title: "Insights → Producción", href: "/marketing/research/insights" },
        ]
      },
    ]
  },
  {
    category: "SISTEMA Y SOPORTE",
    items: [
      {
        title: "Configuración",
        icon: Settings,
        href: "/logistics/settings",
        submenu: [
          { title: "Reglas de Negocio", href: "/logistics/settings" },
          { title: "Libro Mayor", href: "/finances/ledger" },
          { title: "Conexiones API", href: "/connections" },
          { title: "Umbrales y Alertas", href: "/settings/thresholds" }
        ]
      },
      {
        title: "Salud del Sistema",
        icon: ShieldCheck,
        href: "/system/health",
        badge: "OK"
      },
    ]
  }
];

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["Laboratorio Conversión", "Centro Logístico"]);
  const [isHovered, setIsHovered] = useState(false);
  const [clowdbotConfig, setClowdbotConfig] = useState<any>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/clowdbot-config');
        if (res.ok) {
          const data = await res.json();
          setClowdbotConfig(data);
        }
      } catch (e) {
        console.error("Error loading sidebar config:", e);
      }
    }
    loadConfig();
  }, []);

  // Derived state to check if sidebar is effectively open (locked open OR hovered)
  const isEffectiveOpen = isOpen || isHovered;

  const toggleSubmenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Logo Area */}
      <div className="flex h-20 items-center px-6 mt-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">
              ECOMBOM CONTROL
            </span>
            <span className="text-[9px] text-indigo-500 font-bold tracking-widest uppercase">Operations OS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="flex flex-col gap-6">
          {menuItems.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-1">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-3 mb-2">
                {group.category}
              </h4>

              {group.items.map((item: any) => {
                const subActive = item.submenu && item.submenu.some((sub: any) => pathname === sub.href);
                const isActive = pathname === item.href || subActive;
                const isExpanded = expandedMenus.includes(item.title);

                return (
                  <div key={item.title}>
                    {item.submenu ? (
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-between group h-10 px-3 border border-transparent transition-all duration-300",
                            isActive
                              ? "bg-indigo-50/80 text-indigo-700 border-indigo-100 shadow-[0_4px_12px_rgba(79,70,229,0.05)]"
                              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50/80"
                          )}
                          onClick={() => {
                            if (!isEffectiveOpen) toggleSidebar();
                            toggleSubmenu(item.title);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
                            <span className="text-sm font-bold tracking-tight">{item.title}</span>
                          </div>
                          <ChevronDown className={cn("h-3 w-3 transition-transform text-slate-300", isExpanded && "rotate-180")} />
                        </Button>

                        <AnimatePresence>
                          {(isActive || isExpanded) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden ml-4 pl-4 border-l-2 border-slate-100 space-y-1 my-1"
                            >
                              {item.submenu.map((sub: any) => (
                                <Link key={sub.href} href={sub.href} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
                                  <span className={cn(
                                    "block py-2 px-3 text-[13px] rounded-lg transition-all font-medium",
                                    pathname === sub.href ? "text-indigo-700 bg-indigo-50 font-bold" : "text-slate-500 hover:text-indigo-600 hover:translate-x-1"
                                  )}>
                                    {sub.title}
                                  </span>
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link href={item.href} onClick={() => window.innerWidth < 768 && toggleSidebar()}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start group h-10 px-3 relative border border-transparent transition-all duration-300",
                            isActive
                              ? "bg-indigo-50/80 text-indigo-700 border-indigo-100 shadow-[0_4px_12px_rgba(79,70,229,0.05)]"
                              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50/80"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
                          <span className="ml-3 text-sm font-bold tracking-tight">{item.title}</span>
                          {item.badge && <span className="absolute right-3 px-1.5 py-0.5 rounded-md bg-indigo-600 text-[8px] font-black text-white uppercase">{item.badge}</span>}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* User Footer */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/30 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>NB</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-800">Admin Master</span>
            <span className="text-[10px] text-slate-400 font-bold italic tracking-tight">
              {clowdbotConfig?.agentEmail || "admin@ecombom.com"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={isOpen && (typeof window !== 'undefined' && window.innerWidth < 768)} onOpenChange={(open) => {
        if (!open) toggleSidebar();
      }}>
        <SheetContent side="left" className="p-0 w-[280px] md:hidden border-r-0">
          <SheetTitle className="sr-only">Menú de Navegación Mobile</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <motion.aside
        initial={{ width: isOpen ? 260 : 80 }}
        animate={{ width: isEffectiveOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        onMouseEnter={() => !isOpen && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-slate-200 bg-white/95 backdrop-blur-xl",
          "hidden md:flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all",
          isHovered && "shadow-2xl"
        )}
      >
        {/* Logo Area */}
        <div className="flex h-20 items-center px-6 mt-2">
          {isEffectiveOpen ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">
                  ECOMBOM CONTROL
                </span>
                <span className="text-[9px] text-indigo-500 font-bold tracking-widest uppercase">Operations OS</span>
              </div>
            </div>
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-100 flex items-center justify-center mx-auto">
              <Target className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-6 overflow-hidden">
          <nav className="flex flex-col gap-6">
            {menuItems.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-1">
                {isEffectiveOpen && (
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] px-3 mb-2 opacity-80">
                    {group.category}
                  </h4>
                )}

                {group.items.map((item: any) => {
                  const subActive = item.submenu && item.submenu.some((sub: any) => pathname === sub.href);
                  const isActive = pathname === item.href || subActive;
                  const isExpanded = expandedMenus.includes(item.title);

                  return (
                    <div key={item.title}>
                      {item.submenu ? (
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-between group h-10 px-3 border border-transparent transition-all duration-300",
                              !isEffectiveOpen && "justify-center px-0",
                              isActive
                                ? "bg-indigo-50/80 text-indigo-700 border-indigo-100 shadow-[0_4px_12px_rgba(79,70,229,0.05)]"
                                : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50/80"
                            )}
                            onClick={() => {
                              if (!isEffectiveOpen) {
                                toggleSidebar();
                                setIsHovered(true);
                              }
                              toggleSubmenu(item.title);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
                              {isEffectiveOpen && <span className="text-sm font-bold tracking-tight">{item.title}</span>}
                            </div>
                            {isEffectiveOpen && (
                              <ChevronDown className={cn("h-3 w-3 transition-transform text-slate-300", isExpanded && "rotate-180")} />
                            )}
                          </Button>

                          <AnimatePresence>
                            {isEffectiveOpen && (isActive || isExpanded) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden ml-4 pl-4 border-l-2 border-slate-100 space-y-1 my-1"
                              >
                                {item.submenu.map((sub: any) => (
                                  <Link key={sub.href} href={sub.href}>
                                    <span className={cn(
                                      "block py-2 px-3 text-[13px] rounded-lg transition-all font-medium",
                                      pathname === sub.href ? "text-indigo-700 bg-indigo-50 font-bold" : "text-slate-500 hover:text-indigo-600 hover:translate-x-1"
                                    )}>
                                      {sub.title}
                                    </span>
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link href={item.href}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full flex items-center group h-10 px-3 relative border border-transparent transition-all duration-300",
                              !isEffectiveOpen ? "justify-center px-0" : "justify-between",
                              isActive
                                ? "bg-indigo-50/80 text-indigo-700 border-indigo-100 shadow-[0_4px_12px_rgba(79,70,229,0.05)]"
                                : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50/80"
                            )}
                          >
                            <div className={cn("flex items-center gap-3 min-w-0 pr-1", isEffectiveOpen ? "flex-1" : "")}>
                              <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
                              {isEffectiveOpen && (
                                <span className="text-sm font-bold tracking-tight leading-tight whitespace-normal break-words pr-2">
                                  {item.title}
                                </span>
                              )}
                            </div>
                            {isEffectiveOpen && item.badge && (
                              <span className="ml-auto px-1.5 py-0.5 rounded-md bg-indigo-600 text-[8px] font-black text-white uppercase shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <div className={cn("flex items-center gap-3", !isEffectiveOpen && "justify-center")}>
            <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>NB</AvatarFallback>
            </Avatar>
            {isEffectiveOpen && (
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-800">Admin Master</span>
                <span className="text-[10px] text-slate-400 font-bold italic tracking-tight">admin@nanobanana.com</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 w-full z-40 h-16 border-b border-slate-100 bg-white/95 backdrop-blur px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Target className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">ECOMBOM CONTROL</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5 text-slate-600" />
        </Button>
      </div>
    </>
  );
}
