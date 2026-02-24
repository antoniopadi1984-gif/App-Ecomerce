"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { ProductProvider } from "@/context/ProductContext";
import { StoreProvider } from "@/lib/store/store-context";

import { AgentCompanion } from "@/components/layout/agent-companion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                setIsSidebarOpen(false);
                setIsPinned(false);
            } else if (window.innerWidth >= 768) {
                setIsSidebarOpen(false);
                setIsPinned(false);
            } else {
                setIsSidebarOpen(false);
                setIsPinned(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isExpanded = isPinned || isHovered;

    return (
        <StoreProvider>
            <ProductProvider>
                <div className="min-h-screen bg-[#F0F2F5] font-sans antialiased text-foreground">
                    <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isExpanded={isExpanded} />

                    <Sidebar
                        isOpen={isSidebarOpen}
                        isPinned={isPinned}
                        togglePinned={() => setIsPinned(!isPinned)}
                        onHoverChange={setIsHovered}
                    />

                    <main
                        className={cn(
                            "transition-all duration-300 ease-in-out pt-[var(--header-height)] min-h-screen relative overflow-x-hidden",
                            isExpanded ? "ml-[var(--sidebar-width)]" : "ml-[var(--sidebar-collapsed)]",
                            "max-md:ml-0"
                        )}
                    >
                        {/* Mobile Sidebar Backdrop */}
                        {isSidebarOpen && (
                            <div
                                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 md:hidden"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}

                        {/* High-End Decorative Blobs - Optimized for Mobile */}
                        <div className="fixed top-[-5%] right-[-5%] w-[40%] h-[40%] bg-rose-400/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse duration-7000 max-md:opacity-50" />
                        <div className="fixed bottom-[10%] left-[-10%] w-[35%] h-[35%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse duration-10000 max-md:hidden" />
                        <div className="fixed top-[30%] left-[20%] w-[20%] h-[20%] bg-purple-400/5 blur-[100px] rounded-full pointer-events-none -z-10 max-md:hidden" />

                        <div className="p-2 md:p-3 h-full">
                            <div className="glass-panel min-h-[calc(100vh-var(--header-height)-1.5rem)] rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.03)] ring-1 ring-white/50 p-1">
                                {children}
                            </div>
                        </div>
                    </main>

                    <AgentCompanion />
                </div>
            </ProductProvider>
        </StoreProvider>
    );
}
