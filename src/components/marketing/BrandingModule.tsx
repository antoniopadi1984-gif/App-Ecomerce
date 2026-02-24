"use client";

import React from "react";
import { BrandingContent } from "@/components/marketing/BrandingContent";

export function BrandingModule() {
    return (
        <div className="bg-slate-50/30 min-h-[800px] overflow-hidden p-1 backdrop-blur-sm">
            <BrandingContent />
        </div>
    );
}
