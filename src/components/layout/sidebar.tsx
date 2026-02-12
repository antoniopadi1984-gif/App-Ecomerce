'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useProduct } from '@/context/ProductContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Truck, Wallet, BarChart3, Users,
  Sparkles, Video, MessageSquare, FolderOpen, Target, Laptop,
  Microscope, FileText, Globe, TrendingUp, Search, Eye,
  Bot, Settings, Activity, LinkIcon, Sliders, UserCog,
  ChevronDown, Pin, PinOff, Check, Package
} from 'lucide-react';



export function Sidebar({
  isOpen,
  toggleSidebar,
  isPinned,
  togglePinned
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
  isPinned?: boolean;
  togglePinned?: () => void;
}) {
  const pathname = usePathname();
  const { allProducts, product, setProductId } = useProduct();
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = (allProducts || []).filter(p =>
    p?.title?.toLowerCase().includes(productSearch?.toLowerCase() || '')
  );

  // Layers based on UX Architect Specs - PHASE 1.5 REFINEMENT
  const layers = [
    {
      id: 'operaciones',
      label: 'Operaciones',
      items: [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard Master' },
        { href: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
        { href: '/logistics/orders', icon: Truck, label: 'Logística Advanced', badge: 'v2' },
        { href: '/finances', icon: Wallet, label: 'Contabilidad Hub' },
        { href: '/marketing/facebook-ads', icon: BarChart3, label: 'Ads Manager' },
        { href: '/customers', icon: Users, label: 'Clientes' },
      ]
    },
    {
      id: 'produccion',
      label: 'Producción',
      items: [
        { href: '/centro-creativo', icon: Laptop, label: 'Creative Hub' },
        { href: '/marketing/video-lab', icon: Video, label: 'Video Lab' },
        { href: '/marketing/copy-hub', icon: MessageSquare, label: 'Copy Hub' },
        { href: '/marketing/creative-library', icon: FolderOpen, label: 'Asset Library' },
        { href: '/research?tab=angles', icon: Sparkles, label: 'Creative Iteration' },
      ]
    },
    {
      id: 'inteligencia',
      label: 'Inteligencia',
      items: [
        { href: '/research', icon: Microscope, label: 'Research Lab' },
        { href: '/research?tab=angles', icon: Sparkles, label: 'Research Iteration' },
        { href: '/research?tab=forensic', icon: Search, label: 'Intelligence Sources' },
        { href: '/research?tab=validation', icon: FileText, label: 'Validation Reports' },
        { href: '/eagle-eye', icon: Eye, label: 'Eagle Eye' },
      ]
    },
    {
      id: 'ia-sistema',
      label: 'IA & Sistema',
      items: [
        { href: '/marketing/product-brain', icon: Brain, label: 'Brain Hub' },
        { href: '/agentes-ia', icon: Bot, label: 'Agentes IA' },
        { href: '/system/health', icon: Activity, label: 'Salud Sistema' },
        { href: '/connections', icon: LinkIcon, label: 'Conexiones' },
      ]
    }
  ];


  return (
    <aside className={cn(
      "fixed left-0 top-0 z-50 bg-white border-r border-slate-200 h-screen flex flex-col overflow-hidden transition-all duration-300",
      isOpen ? "w-60" : "w-16"
    )}>
      {/* Logo Section */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 h-14 bg-slate-50/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm tracking-tighter">G</span>
          </div>
          {isOpen && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="font-black text-sm tracking-tighter uppercase italic leading-none">GAIA OS</span>
              <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest leading-none">V100.0</p>
            </div>
          )}
        </div>
        {isOpen && togglePinned && (
          <button onClick={togglePinned} className="text-slate-300 hover:text-indigo-600 transition-colors">
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Product Selector - Compact Version (GAIA MAP Preservation) */}
      {isOpen && (
        <div className="px-3 pt-3 pb-1 shrink-0 relative">
          <button
            onClick={() => setShowProductSelector(!showProductSelector)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {product?.imageUrl ? (
                  <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-3 h-3 text-slate-400" />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-700 truncate tracking-tight">
                {product?.title || "Contexto Global"}
              </span>
            </div>
            <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", showProductSelector && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showProductSelector && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-3 right-3 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      className="w-full pl-7 pr-2 py-1 text-[10px] bg-slate-50 border-none rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1 no-scrollbar">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setProductId(p.id);
                        setShowProductSelector(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-all",
                        product?.id === p.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <div className="w-5 h-5 rounded border border-slate-200 bg-white overflow-hidden shrink-0">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Package className="w-2.5 h-2.5 text-slate-300 mx-auto mt-1" />}
                      </div>
                      <span className="text-[10px] font-bold truncate tracking-tight leading-none">{p.title}</span>
                      {product?.id === p.id && <Check className="w-2.5 h-2.5 ml-auto text-indigo-600" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Navigation - Section Based */}
      <nav className="flex-1 overflow-y-auto no-scrollbar pt-2">
        {layers.map((layer) => (
          <div key={layer.id} className="mb-4">
            {isOpen && (
              <h3 className="px-5 mb-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{layer.label}</h3>
            )}
            <div className="px-2 space-y-0.5">
              {layer.items.map((item, idx) => (
                <NavItem
                  key={idx}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isOpen={isOpen}
                  isActive={pathname === item.href}
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
              <span className="text-[11px] font-bold text-slate-900 truncate tracking-tight uppercase">Admin Master</span>
              <span className="text-[9px] text-slate-500 truncate italic">v100 Stable</span>
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
        "flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold group",
        isActive
          ? "bg-slate-900 text-white shadow-md shadow-slate-200"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
      {isOpen && (
        <span className="truncate tracking-tight flex-1">{label}</span>
      )}
      {isOpen && badge && (
        <Badge className={cn(
          "h-4 px-1 text-[8px] border-none font-black uppercase",
          badge === 'v2' || badge === 'PRO' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
        )}>
          {badge}
        </Badge>
      )}
    </Link>
  );
}

function Brain(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 4 4 0 0 0 1.627 0 4 4 0 0 0 .52-8.105 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.52 8.105 4 4 0 0 1-1.627 0 4 4 0 0 1-.52-8.105 4 4 0 0 1 2.526-5.77A3 3 0 1 1 12 5z" />
    </svg>
  )
}
