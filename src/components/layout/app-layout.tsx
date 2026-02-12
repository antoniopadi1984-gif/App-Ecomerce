"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { ProductProvider } from "@/context/ProductContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) { // Large screens: pinned by default
                setIsSidebarOpen(true);
                setIsPinned(true);
            } else if (window.innerWidth >= 768) { // Medium screens: slim by default
                setIsSidebarOpen(false);
                setIsPinned(true);
            } else {
                setIsSidebarOpen(false);
                setIsPinned(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <ProductProvider>
            <div className="min-h-screen bg-[#F7F8FA] font-sans antialiased text-foreground">
                <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

                <Sidebar
                    isOpen={isSidebarOpen}
                    isPinned={isPinned}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    togglePinned={() => setIsPinned(!isPinned)}
                />

                <main
                    className={cn(
                        "transition-all duration-300 ease-in-out pt-14 min-h-screen", // pt-14 matches TopBar h-14
                        isPinned
                            ? (isSidebarOpen ? "md:ml-60" : "md:ml-16") // md:ml-60 = 240px
                            : "md:ml-0"
                    )}
                >
                    {/* HIGH DENSITY CONTAINER: Apple Dashboard Style */}
                    <div className="px-2 md:px-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </ProductProvider>
    );
}

