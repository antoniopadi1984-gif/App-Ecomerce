"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { StoreProvider, useStore } from "@/lib/store/store-context";
import { ProductProvider } from "@/context/ProductContext";

// Inner layout that has access to StoreContext
function InnerLayout({ children }: { children: React.ReactNode }) {
    const { activeStoreId } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPinned, setIsPinned] = useState(true);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                setIsSidebarOpen(false);
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

    // True when sidebar is visually wide (hover on desktop, or open on mobile)
    const sidebarWide = isSidebarExpanded || isSidebarOpen;

    return (
        <ProductProvider key={activeStoreId || 'no-store'} storeId={activeStoreId}>
            <div className="min-h-screen bg-[#F7F8FA] font-sans antialiased text-foreground">
                <TopBar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isExpanded={sidebarWide} />
                <Sidebar
                    isOpen={isSidebarOpen}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onHoverChange={(h) => setIsSidebarExpanded(h)}
                />
                <main
                    className="transition-all duration-200 ease-in-out pt-[50px] min-h-screen"
                    style={{
                        marginLeft: isPinned
                            ? (sidebarWide ? '204px' : '52px')
                            : '0px'
                    }}
                >
                    <div className="px-3 md:px-5 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
