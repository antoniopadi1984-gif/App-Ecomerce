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
                <div className="min-h-screen bg-[#f4f7fb] font-sans antialiased text-foreground">
                    <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isExpanded={isExpanded} />

                    <Sidebar
                        isOpen={isSidebarOpen}
                        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
                                className="fixed inset-0 bg-black/10 z-40 md:hidden"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}

                        <div className="h-full">
                            {children}
                        </div>
                    </main>

                    <AgentCompanion />
                </div>
            </ProductProvider>
        </StoreProvider>
    );
}
