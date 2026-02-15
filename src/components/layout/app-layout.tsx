"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { ProductProvider } from "@/context/ProductContext";
import { StoreProvider } from "@/lib/store/store-context";

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
                <div className="min-h-screen bg-[#F7F8FA] font-sans antialiased text-foreground">
                    <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

                    <Sidebar
                        isOpen={isSidebarOpen}
                        isPinned={isPinned}
                        togglePinned={() => setIsPinned(!isPinned)}
                        onHoverChange={setIsHovered}
                    />

                    <main
                        className={cn(
                            "transition-all duration-300 ease-in-out pt-14 min-h-screen",
                            isExpanded ? "md:ml-60" : "md:ml-[72px]"
                        )}
                    >
                        {/* HIGH DENSITY CONTAINER: Apple Dashboard Style */}
                        <div className="px-2 md:px-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {children}
                        </div>
                    </main>
                </div>
            </ProductProvider>
        </StoreProvider>
    );
}

