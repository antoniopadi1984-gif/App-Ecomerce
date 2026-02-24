"use client";

import React from "react";
import { ClowdbotConfig } from "@/components/marketing/clowdbot-config";

export function ClowdbotLabModule() {
    return (
        <div className="bg-slate-900 -mx-8 -my-8 min-h-[800px] overflow-hidden p-8">
            <ClowdbotConfig />
        </div>
    );
}
