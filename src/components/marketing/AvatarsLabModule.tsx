"use client";

import React from "react";
import AvatarStudioPage from "@/app/marketing/avatars/page";

export function AvatarsModule() {
    return (
        <div className="bg-slate-50/30 -m-3 p-3 min-h-[800px] overflow-hidden">
            <AvatarStudioPage isEmbedded={true} />
        </div>
    );
}
