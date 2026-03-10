"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { StoreProvider, useStore } from "@/lib/store/store-context";
import { ProductProvider } from "@/context/ProductContext";

// Inner layout that has access to StoreContext
function InnerLayout({ children }: { children: React.ReactNode }) {
    const { activeStoreId } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                setIsSidebarOpen(true);
                setIsPinned(true);
            } else if (window.innerWidth >= 768) {
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
        // Key on activeStoreId forces ProductProvider to remount and refetch when store changes
        <ProductProvider key={activeStoreId || 'no-store'} storeId={activeStoreId}>
            <div className="min-h-screen bg-[#F7F8FA] font-sans antialiased text-foreground">
                <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                />
                <main
                    className={cn(
                        "transition-all duration-300 ease-in-out pt-14 min-h-screen",
                        isPinned
                            ? (isSidebarOpen ? "md:ml-60" : "md:ml-16")
                            : "md:ml-0"
                    )}
                >
                    <div className="px-2 md:px-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </ProductProvider>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <StoreProvider>
            <InnerLayout>{children}</InnerLayout>
        </StoreProvider>
    );
}
